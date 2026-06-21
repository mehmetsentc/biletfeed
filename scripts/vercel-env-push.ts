#!/usr/bin/env tsx
/**
 * .env.local + firebase-admin.json → Vercel production env
 * Kullanım: tsx scripts/vercel-env-push.ts [production-url]
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const prodUrl = process.argv[2] || 'https://biletfeed.vercel.app';
const prodHost = prodUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

function loadEnvLocal(): Record<string, string> {
  const path = resolve(process.cwd(), '.env.local');
  if (!existsSync(path)) {
    console.error('❌ .env.local bulunamadı');
    process.exit(1);
  }

  const env: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function addEnv(name: string, value: string | undefined) {
  if (!value) {
    console.log(`  ⚠️  ${name} boş — atlandı`);
    return;
  }
  try {
    execSync(`npx vercel env add ${name} production --force`, {
      input: value,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(`  ✅ ${name}`);
  } catch {
    console.log(`  ⚠️  ${name} eklenemedi`);
  }
}

function main() {
  try {
    execSync('npx vercel whoami', { stdio: 'pipe' });
  } catch {
    console.error('❌ Vercel girişi yok. Önce: npx vercel login');
    process.exit(1);
  }

  const env = loadEnvLocal();
  console.log(`\n→ Vercel env yükleniyor (host: ${prodHost})\n`);

  addEnv('DATABASE_URL', env.DATABASE_URL);
  addEnv('NEXT_PUBLIC_APP_NAME', env.NEXT_PUBLIC_APP_NAME || 'Bilet Feed');
  addEnv(
    'NEXT_PUBLIC_APP_DESCRIPTION',
    env.NEXT_PUBLIC_APP_DESCRIPTION ||
      'Modern etkinlik keşif ve bilet platformu'
  );
  addEnv('NEXT_PUBLIC_APP_URL', prodUrl);
  addEnv('NEXT_PUBLIC_SITE_URL', prodUrl);
  addEnv('NEXT_PUBLIC_ROOT_DOMAIN', prodHost);
  addEnv('NEXT_PUBLIC_CANONICAL_HOST', prodHost);
  addEnv(
    'NEXT_PUBLIC_ENABLE_SUBDOMAINS',
    env.NEXT_PUBLIC_ENABLE_SUBDOMAINS || 'false'
  );
  addEnv('NEXT_PUBLIC_ENABLE_AI', env.NEXT_PUBLIC_ENABLE_AI || 'false');
  addEnv('NEXT_PUBLIC_FIREBASE_API_KEY', env.NEXT_PUBLIC_FIREBASE_API_KEY);
  addEnv(
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  );
  addEnv(
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
  addEnv(
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  );
  addEnv(
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  );
  addEnv('NEXT_PUBLIC_FIREBASE_APP_ID', env.NEXT_PUBLIC_FIREBASE_APP_ID);

  const adminPath = resolve(process.cwd(), 'firebase-admin.json');
  if (existsSync(adminPath)) {
    const json = readFileSync(adminPath, 'utf8').trim();
    addEnv('FIREBASE_SERVICE_ACCOUNT_JSON', json);
  } else {
    addEnv('FIREBASE_ADMIN_PROJECT_ID', env.FIREBASE_ADMIN_PROJECT_ID);
    addEnv('FIREBASE_ADMIN_CLIENT_EMAIL', env.FIREBASE_ADMIN_CLIENT_EMAIL);
    addEnv('FIREBASE_ADMIN_PRIVATE_KEY', env.FIREBASE_ADMIN_PRIVATE_KEY);
  }

  let ticket = env.TICKET_SECRET_KEY;
  if (!ticket || ticket === 'dev-secret-change-in-production') {
    ticket = execSync('openssl rand -base64 32', { encoding: 'utf8' }).trim();
    console.log('  → Yeni TICKET_SECRET_KEY üretildi');
  }
  addEnv('TICKET_SECRET_KEY', ticket);

  // AI — DeepSeek + Gemini
  addEnv('AI_ENABLED', env.AI_ENABLED || 'true');
  addEnv('SCRAPER_AI_ENABLED', env.SCRAPER_AI_ENABLED || 'true');
  addEnv('SCRAPER_AI_PROVIDER', env.SCRAPER_AI_PROVIDER || 'deepseek');
  addEnv(
    'SCRAPER_AI_FALLBACK_PROVIDER',
    env.SCRAPER_AI_FALLBACK_PROVIDER || 'gemini'
  );
  addEnv('DEEPSEEK_API_KEY', env.DEEPSEEK_API_KEY);
  addEnv('DEEPSEEK_MODEL', env.DEEPSEEK_MODEL || 'deepseek-chat');
  addEnv('GEMINI_API_KEY', env.GEMINI_API_KEY);
  addEnv('GEMINI_MODEL', env.GEMINI_MODEL || 'gemini-2.0-flash');
  addEnv('SCRAPER_AI_DEDUPE', env.SCRAPER_AI_DEDUPE || 'false');

  let cronSecret = env.CRON_SECRET;
  if (!cronSecret) {
    cronSecret = execSync('openssl rand -hex 32', { encoding: 'utf8' }).trim();
    console.log('  → Yeni CRON_SECRET üretildi');
  }
  addEnv('CRON_SECRET', cronSecret);

  console.log('\n✅ Env yüklendi. Deploy: npm run deploy\n');
}

main();
