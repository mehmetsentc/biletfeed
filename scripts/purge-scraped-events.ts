/**
 * Tüm harici (scraper) etkinlikleri siler — internal etkinlikler kalır.
 *
 * Kullanım: npx dotenv -e .env.local -- tsx scripts/purge-scraped-events.ts
 */
import {
  getScrapedEventsSummary,
  purgeScrapedEvents
} from '@/lib/services/purge-scraped-events';

async function main() {
  const before = await getScrapedEventsSummary();
  console.log('Önce:', before);

  if (before.external === 0) {
    console.log('Silinecek harici etkinlik yok.');
    return;
  }

  const result = await purgeScrapedEvents();
  const after = await getScrapedEventsSummary();

  console.log('Silindi:', result);
  console.log('Sonra:', after);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
