/**
 * Production migration — Neon pooler URL ile `prisma migrate deploy` takılabilir.
 * Bu script migrasyon için doğrudan (non-pooler) bağlantı kullanır.
 */
import { config } from 'dotenv';
import { execSync } from 'child_process';

config({ path: '.env.local' });

const poolUrl = process.env.DATABASE_URL;
if (!poolUrl) {
  console.error('DATABASE_URL tanımlı değil (.env.local)');
  process.exit(1);
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

execSync('prisma migrate deploy', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: migrateUrl },
  cwd: process.cwd()
});
