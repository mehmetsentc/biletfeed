import { extractEventsWithAi } from '@/lib/scraper/ai/extract-events';
import { fetchHtml } from '@/lib/scraper/normalize';

async function test(platform: 'BILETIX' | 'BILETIMO', url: string) {
  console.log(`\n--- ${platform} ${url} ---`);
  const html = await fetchHtml(url);
  console.log('html bytes:', html.length);
  const r = await extractEventsWithAi(platform, html, url);
  console.log('events:', r.events.length, r.error || '');
  for (const e of r.events.slice(0, 3)) {
    console.log(' -', e.title, '|', e.startDate.toISOString(), '|', e.externalUrl);
  }
}

async function main() {
  await test('BILETIX', 'https://www.biletix.com/search/ISTANBUL/tr');
  await test('BILETIX', 'https://www.biletix.com/category/MUSIC/ISTANBUL/tr');
  await test('BILETIMO', 'https://www.biletimo.com/istanbul-etkinlikleri');
  await test('BILETIMO', 'https://www.biletimo.com/etkinlikler');
}

main().catch(console.error);
