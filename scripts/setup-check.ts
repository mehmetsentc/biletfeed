#!/usr/bin/env tsx
/**
 * Kurulum durumunu kontrol eder.
 * Kullanım: npm run setup:check
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

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

type Status = 'ok' | 'warn' | 'fail';

function row(label: string, status: Status, detail: string) {
  const icon = status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${label}: ${detail}`);
}

console.log('\n🔍 Bilet Feed — Kurulum Kontrolü\n');

// Firebase Client
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const fbClient = apiKey && projectId;

row(
  'Firebase Client',
  fbClient ? 'ok' : 'fail',
  fbClient ? 'yapılandırıldı' : 'NEXT_PUBLIC_FIREBASE_* eksik'
);

if (apiKey && apiKey.length < 30) {
  row('Firebase API Key', 'fail', 'API key çok kısa — Firebase Console\'dan yeniden kopyalayın');
}

const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const expectedDomain = projectId ? `${projectId}.firebaseapp.com` : '';
if (fbClient && authDomain && expectedDomain && authDomain !== expectedDomain) {
  row(
    'Firebase authDomain',
    'warn',
    `beklenen: ${expectedDomain}, mevcut: ${authDomain}`
  );
} else if (fbClient) {
  row('Firebase authDomain', 'ok', authDomain || expectedDomain);
}

if (fbClient) {
  console.log('');
  console.log('  Firebase API key geçersiz hatası alırsanız:');
  console.log('  1. console.firebase.google.com → BiletFeed → ⚙️ Project settings');
  console.log('  2. General → Your apps → Web app → SDK config kopyala');
  console.log('  3. .env.local NEXT_PUBLIC_FIREBASE_* güncelle');
  console.log('  4. Google Cloud → Credentials → API key → localhost kısıtı kaldır');
  console.log('  5. npm run dev:kill && npm run dev:fast (yeniden başlat)\n');
}

// Firebase Admin
const adminFile = existsSync(resolve(root, 'firebase-admin.json'));
const adminEnv =
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
  process.env.FIREBASE_ADMIN_PRIVATE_KEY;
row(
  'Firebase Admin',
  adminFile || adminEnv ? 'ok' : 'fail',
  adminFile
    ? 'firebase-admin.json bulundu'
    : adminEnv
      ? 'ortam değişkenleri ayarlı'
      : 'firebase-admin.json veya FIREBASE_ADMIN_* gerekli'
);

// Database
const dbUrl = process.env.DATABASE_URL;
row(
  'PostgreSQL',
  dbUrl ? 'ok' : 'fail',
  dbUrl ? 'DATABASE_URL ayarlı' : 'DATABASE_URL boş — Neon veya Docker gerekli'
);

// Ticket secret
const ticketSecret = process.env.TICKET_SECRET_KEY;
row(
  'Ticket Secret',
  ticketSecret && ticketSecret !== 'dev-secret-change-in-production'
    ? 'ok'
    : 'warn',
  ticketSecret ? 'ayarlı (production için güçlü anahtar önerilir)' : 'eksik'
);

row(
  'Firebase Storage',
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'ok' : 'warn',
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    : 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET eksik'
);

// Payment
const paymentProvider = process.env.PAYMENT_PROVIDER || 'mock';
row(
  'Ödeme',
  paymentProvider === 'mock' ? 'warn' : 'ok',
  paymentProvider === 'mock'
    ? 'mock modu (Phase 4: iyzico/Stripe)'
    : `${paymentProvider} yapılandırıldı`
);

// Vercel / domain hints
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
if (siteUrl.includes('biletfeed.com')) {
  row('Production domain', 'ok', siteUrl);
} else if (siteUrl.includes('vercel.app')) {
  row('Production domain', 'warn', `${siteUrl} — özel domain bekleniyor`);
}

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

if (dbUrl) {
  console.log('→ npm run db:setup   (schema + seed)');
}
if ((adminFile || adminEnv) && fbClient) {
  console.log('→ npm run dev:fresh  (auth test: /giris)');
}
console.log('→ npm run setup:check (bu scripti tekrar çalıştır)\n');

const fails = [!fbClient, !adminFile && !adminEnv, !dbUrl].filter(Boolean).length;
process.exit(fails > 0 ? 1 : 0);
