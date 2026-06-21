import type { ScrapedEventRaw } from '@/lib/scraper/types';
import { normalizeTitle } from '@/lib/scraper/dedupe';
import { isScraperAiReady } from '@/lib/scraper/ai/config';
import { scraperAiChat } from '@/lib/scraper/ai/client';

interface DedupeGroup {
  keepIndex: number;
  mergeIndexes: number[];
  reason?: string;
}

interface AiDedupeResponse {
  groups?: DedupeGroup[];
}

/**
 * AI ile fuzzy dedupe — başlık/tarih/şehir benzer ama hash farklı kayıtları birleştirir.
 * Opsiyonel; SCRAPER_AI_DEDUPE=true gerektirir.
 */
export async function dedupeEventsWithAi(
  events: ScrapedEventRaw[]
): Promise<ScrapedEventRaw[]> {
  if (
    !isScraperAiReady() ||
    process.env.SCRAPER_AI_DEDUPE !== 'true' ||
    events.length < 2
  ) {
    return events;
  }

  const summary = events.slice(0, 80).map((e, i) => ({
    index: i,
    title: e.title,
    city: e.cityName,
    date: e.startDate.toISOString().slice(0, 10),
    platform: e.platform,
    url: e.externalUrl
  }));

  try {
    const raw = await scraperAiChat(
      [
        {
          role: 'system',
          content: `Aynı etkinliğin farklı platformlardaki kayıtlarını grupla.
JSON döndür: {"groups":[{"keepIndex":0,"mergeIndexes":[3,7]}]}
keepIndex: listede kalacak en iyi kayıt. mergeIndexes: silinecek/tekrar sayılacak indeksler.
Farklı etkinlikleri birleştirme.`
        },
        {
          role: 'user',
          content: JSON.stringify(summary)
        }
      ],
      { jsonMode: true, temperature: 0 }
    );

    const parsed = JSON.parse(raw) as AiDedupeResponse;
    const remove = new Set<number>();

    for (const group of parsed.groups || []) {
      for (const idx of group.mergeIndexes) {
        if (idx !== group.keepIndex) remove.add(idx);
      }
    }

    return events.filter((_, i) => !remove.has(i));
  } catch {
    return events;
  }
}

export function quickSimilarity(a: ScrapedEventRaw, b: ScrapedEventRaw): boolean {
  if (a.citySlug !== b.citySlug) return false;
  if (a.startDate.toISOString().slice(0, 10) !== b.startDate.toISOString().slice(0, 10)) {
    return false;
  }
  const ta = normalizeTitle(a.title);
  const tb = normalizeTitle(b.title);
  if (ta === tb) return true;
  return ta.includes(tb) || tb.includes(ta);
}
