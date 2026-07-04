#!/usr/bin/env tsx
/**
 * Kurulum durumunu kontrol eder.
 * Kullanım: npm run setup:check
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { countEnvFailures, getEnvStatusItems } from '../lib/config/env-status';

const root = process.cwd();

function loadEnvLocal() {
  const path = resolve(root, '.env.local');
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

function row(label: string, status: 'ok' | 'warn' | 'fail', detail: string) {
  const icon = status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${label}: ${detail}`);
}

console.log('\n🔍 Bilet Feed — Kurulum Kontrolü\n');

const items = getEnvStatusItems();

// firebase-admin.json dosyası env-status'ta kontrol edilmez; yerel geliştirme için ek kontrol
const adminFile = existsSync(resolve(root, 'firebase-admin.json'));
if (adminFile) {
  const adminItem = items.find((item) => item.label === 'Firebase Admin');
  if (adminItem?.status === 'fail') {
    adminItem.status = 'ok';
    adminItem.detail = 'firebase-admin.json bulundu';
  }
}

for (const item of items) {
  row(item.label, item.status, item.detail);
}

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const fbClient = apiKey && projectId;

if (fbClient) {
  console.log('');
  console.log('  Firebase API key geçersiz hatası alırsanız:');
  console.log('  1. console.firebase.google.com → BiletFeed → ⚙️ Project settings');
  console.log('  2. General → Your apps → Web app → SDK config kopyala');
  console.log('  3. .env.local NEXT_PUBLIC_FIREBASE_* güncelle');
  console.log('  4. Google Cloud → Credentials → API key → localhost kısıtı kaldır');
  console.log('  5. npm run dev:kill && npm run dev:fast (yeniden başlat)\n');
}

const dbUrl = process.env.DATABASE_URL;
const adminEnv =
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY;

console.log('\n📋 Sıradaki adımlar:\n');

if (!dbUrl) {
  console.log('1. PostgreSQL:');
  console.log('   • Neon (önerilen): https://neon.tech → yeni proje → connection string');
  console.log('   • veya Docker: docker compose up -d');
  console.log('     DATABASE_URL=postgresql://biletfeed:biletfeed_dev@localhost:5432/biletfeed');
  console.log('   Sonra: npm run db:setup\n');
}

if (!adminFile && !adminEnv) {
  console.log('2. Firebase Admin:');
  console.log('   Firebase Console → Project Settings → Service accounts');
  console.log('   → Generate new private key → firebase-admin.json olarak kaydet\n');
}

if (!process.env.CRON_SECRET?.trim()) {
  console.log('3. Cron & Redis (production):');
  console.log('   • CRON_SECRET: openssl rand -base64 32');
  console.log('   • UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (rate limit)');
  console.log('   • npm run deploy:checklist — tam Vercel env listesi\n');
}

if (dbUrl) {
  console.log('→ npm run db:setup        (schema + seed + etkinlik kuralları)');
  console.log('→ npm run seed:event-rules (kuralları yeniden yükle)');
}
if ((adminFile || adminEnv) && fbClient) {
  console.log('→ npm run dev:fresh       (auth test: /giris)');
}
console.log('→ npm run setup:check     (bu scripti tekrar çalıştır)\n');

const fails = countEnvFailures(items);
process.exit(fails > 0 ? 1 : 0);
