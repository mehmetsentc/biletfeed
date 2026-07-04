#!/usr/bin/env tsx
/**
 * Kurulum durumunu kontrol eder.
 * Kullanım: npm run setup:check
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { isPaymentProviderConfigured } from '../lib/payments/config';

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
    : process.env.NODE_ENV === 'production'
      ? 'fail'
      : 'warn',
  ticketSecret ? 'ayarlı' : 'eksik'
);

const sessionSecret = process.env.NEXTAUTH_SECRET;
row(
  'Session Secret (NEXTAUTH_SECRET)',
  sessionSecret && sessionSecret !== 'dev-session-secret-local-only'
    ? 'ok'
    : process.env.NODE_ENV === 'production'
      ? 'fail'
      : 'warn',
  sessionSecret ? 'ayarlı' : 'eksik — production için zorunlu'
);

if (
  process.env.NODE_ENV === 'production' &&
  process.env.ENABLE_MOCK_PAYMENTS === 'true'
) {
  row('Mock ödeme', 'fail', 'ENABLE_MOCK_PAYMENTS production ortamında kapalı olmalı');
}

const cronSecret = process.env.CRON_SECRET;
row(
  'Cron Secret',
  cronSecret ? 'ok' : process.env.NODE_ENV === 'production' ? 'warn' : 'warn',
  cronSecret ? 'ayarlı' : 'CRON_SECRET önerilir'
);

row(
  'Firebase Storage',
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'ok' : 'warn',
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    : 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET eksik'
);

// Payment — docs/PAYMENTS-TR.md
const paymentProvider = process.env.PAYMENT_PROVIDER || 'mock';
const configured = isPaymentProviderConfigured(
  paymentProvider as 'mock' | 'iyzico' | 'paytr' | 'stripe' | 'free'
);
row(
  'Ödeme',
  paymentProvider === 'mock' ? 'warn' : configured ? 'ok' : 'fail',
  paymentProvider === 'mock'
    ? 'mock modu — geliştirme için uygun'
    : configured
      ? `${paymentProvider} anahtarları tanımlı`
      : `${paymentProvider} seçili ama API anahtarları eksik`
);

const resendKey = process.env.RESEND_API_KEY?.trim();
row(
  'E-posta (Resend)',
  resendKey ? 'ok' : process.env.NODE_ENV === 'production' ? 'warn' : 'warn',
  resendKey
    ? 'RESEND_API_KEY ayarlı'
    : 'eksik — e-postalar gönderilmez (log-only)'
);

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
row(
  'Redis (Upstash)',
  redisUrl && redisToken ? 'ok' : 'warn',
  redisUrl && redisToken
    ? 'dağıtık rate limit aktif'
    : 'eksik — bellek içi rate limit (serverless uyarısı)'
);

const superAdmins = process.env.SUPER_ADMIN_EMAILS?.trim();
row(
  'Super Admin',
  superAdmins ? 'ok' : process.env.NODE_ENV === 'production' ? 'warn' : 'warn',
  superAdmins ? 'SUPER_ADMIN_EMAILS ayarlı' : 'SUPER_ADMIN_EMAILS önerilir'
);

const companyIban = process.env.COMPANY_IBAN?.trim();
row(
  'Muhasebe IBAN',
  companyIban ? 'ok' : 'warn',
  companyIban ? 'COMPANY_IBAN ayarlı' : 'fatura/hakediş için COMPANY_IBAN önerilir'
);

const canonicalHost =
  process.env.NEXT_PUBLIC_CANONICAL_HOST ||
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
  '';
row(
  'Subdomain env',
  canonicalHost.includes('biletfeed.com') || canonicalHost.includes('localhost')
    ? 'ok'
    : process.env.NODE_ENV === 'production'
      ? 'warn'
      : 'warn',
  canonicalHost
    ? `NEXT_PUBLIC_CANONICAL_HOST/ROOT_DOMAIN → ${canonicalHost}`
    : 'NEXT_PUBLIC_CANONICAL_HOST veya ROOT_DOMAIN eksik — çerez paylaşımı etkilenebilir'
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
