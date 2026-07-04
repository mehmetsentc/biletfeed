#!/usr/bin/env tsx
/**
 * Production cron tetikle:
 *   npm run cron:trigger
 *   npm run cron:trigger -- seed-event-rules
 *   CRON_TARGET_URL=https://biletfeed.com/api/cron/accounting npm run cron:trigger
 */
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://biletfeed.com';
const cronJob = process.argv[2]?.trim();
const target =
  process.env.CRON_TARGET_URL ||
  (cronJob ? `${appUrl}/api/cron/${cronJob}` : `${appUrl}/api/cron/scrape-events`);
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
