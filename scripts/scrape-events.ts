#!/usr/bin/env tsx
/**
 * Manuel scraper: npm run scrape:run
 */
import { runEventScrapeJob } from '../lib/scraper/sync';

async function main() {
  console.log('Bilet Feed etkinlik scraper başlıyor...\n');
  const { runId, status, stats } = await runEventScrapeJob();

  console.log('Run ID:', runId);
  console.log('Durum:', status);
  console.log('Çekilen:', stats.totalFetched);
  console.log('Yeni:', stats.totalCreated);
  console.log('Güncellenen:', stats.totalUpdated);
  console.log('Atlanan:', stats.totalSkipped);
  console.log('Tekilleştirilen:', stats.totalDeduped);

  if (stats.errors.length) {
    console.log('\nHatalar:');
    stats.errors.forEach((e) => console.log(' -', e));
  }

  console.log('\nPlatform istatistikleri:', stats.platformStats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
