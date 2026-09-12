/**
 * Production migration — Neon pooler URL ile `prisma migrate deploy` takılabilir.
 * Bu script migrasyon için doğrudan (non-pooler) bağlantı kullanır.
 *
 * Neon cold start / eşzamanlı Vercel build'lerde varsayılan 10s advisory lock
 * (P1002) sık düşer → retry + opsiyonel lock bypass.
 */
import { config } from 'dotenv';
import { execSync } from 'child_process';

config({ path: '.env.local' });

// GitHub Actions: CI=true → atla (dummy DB / migrate gerekmez)
// Vercel: CI=1 gelir; DATABASE_URL varsa migrate çalışır
if (process.env.CI === 'true' || process.env.SKIP_MIGRATE === 'true') {
  console.log('[migrate] CI ortamı — migration atlandı');
  process.exit(0);
}

const poolUrl = process.env.DATABASE_URL;
if (!poolUrl) {
  // Preview’da env eksikse build’i düşürme — prisma generate + next build devam etsin.
  // Production’da DATABASE_URL Vercel env’de tanımlı olmalı.
  console.warn(
    '[migrate] DATABASE_URL yok — migration atlandı (Vercel Preview env / .env.local kontrol et)'
  );
  process.exit(0);
}

function deriveDirectUrl(url: string): string {
  if (!url.includes('-pooler')) return url;
  return url
    .replace('-pooler', '')
    .replace(/([?&])pgbouncer=true&?/g, '$1')
    .replace(/([?&])connect_timeout=\d+&?/g, '$1')
    .replace(/[?&]$/, '');
}

const migrateUrl = process.env.DIRECT_DATABASE_URL ?? deriveDirectUrl(poolUrl);
if (migrateUrl !== poolUrl) {
  console.log('[migrate] Doğrudan Neon bağlantısı kullanılıyor (pooler atlandı)');
}

const maxAttempts = 3;

function runMigrate(disableAdvisoryLock: boolean): void {
  execSync('prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: migrateUrl,
      ...(disableAdvisoryLock
        ? { PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: '1' }
        : {})
    },
    cwd: process.cwd()
  });
}

let lastError: unknown;
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  const disableLock = attempt === maxAttempts;
  try {
    if (attempt > 1) {
      console.log(
        `[migrate] yeniden deneme ${attempt}/${maxAttempts}` +
          (disableLock ? ' (advisory lock kapalı)' : '')
      );
      execSync('sleep 3');
    }
    runMigrate(disableLock);
    process.exit(0);
  } catch (err) {
    lastError = err;
    console.error(`[migrate] deneme ${attempt} başarısız`);
  }
}

console.error('[migrate] tüm denemeler başarısız');
throw lastError;
