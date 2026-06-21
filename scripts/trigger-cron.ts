#!/usr/bin/env tsx
/**
 * Production cron tetikle: npm run cron:trigger
 * .env.local: CRON_SECRET + opsiyonel CRON_TARGET_URL
 */
const target =
  process.env.CRON_TARGET_URL ||
  'https://biletfeed.com/api/cron/scrape-events';
const secret = process.env.CRON_SECRET;

async function main() {
  if (!secret) {
    console.error('CRON_SECRET tanımlı değil (.env.local veya Vercel env)');
    process.exit(1);
  }

  console.log('Cron tetikleniyor:', target);

  const res = await fetch(target, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json'
    }
  });

  const body = await res.text();
  console.log('HTTP', res.status);
  console.log(body);

  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
