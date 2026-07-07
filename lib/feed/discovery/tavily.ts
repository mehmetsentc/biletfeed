/**
 * Tavily AI Search entegrasyonu — güncel konser/etkinlik haberi keşfi
 */
import type { DiscoveredItem } from '@/lib/feed/ai-editor';
import type { TavilyQuery } from './sources';

const TAVILY_API_URL = 'https://api.tavily.com/search';

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
}

async function searchTavily(query: TavilyQuery): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY env değişkeni eksik');

  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      query: query.query,
      topic: query.topic,
      time_range: query.timeRange,
      search_depth: 'basic',
      include_answer: false,
      max_results: 5
    }),
    // 15 saniye timeout
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Tavily API hatası ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as TavilyResponse;
  return data.results ?? [];
}

/**
 * Tüm Tavily sorgularını çalıştır, DiscoveredItem listesi döndür.
 * Her sorgu arasında 500ms bekler (rate limit).
 */
export async function discoverViaTavily(
  queries: TavilyQuery[]
): Promise<{ items: DiscoveredItem[]; errors: string[] }> {
  const items: DiscoveredItem[] = [];
  const errors: string[] = [];

  for (const query of queries) {
    try {
      const results = await searchTavily(query);
      for (const r of results) {
        if (!r.url || !r.title) continue;
        // Çok kısa snippet'leri atla
        if ((r.content?.length ?? 0) < 50) continue;

        items.push({
          sourceUrl: r.url,
          sourceTitle: r.title,
          sourceSnippet: r.content?.slice(0, 500),
          sourceName: extractDomainName(r.url)
        });
      }
      // Sorgular arası 500ms gecikme
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      errors.push(
        `Tavily sorgu hatası ("${query.query}"): ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { items, errors };
}

function extractDomainName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    // hurriyet.com.tr → Hürriyet gibi bilinen alanları güzel isimlendir
    const knownDomains: Record<string, string> = {
      'hurriyet.com.tr': 'Hürriyet',
      'milliyet.com.tr': 'Milliyet',
      'sabah.com.tr': 'Sabah',
      'ntv.com.tr': 'NTV',
      'pitchfork.com': 'Pitchfork',
      'rollingstone.com': 'Rolling Stone',
      'nme.com': 'NME',
      'billboard.com': 'Billboard',
      'cumhuriyet.com.tr': 'Cumhuriyet',
      'haberturk.com': 'Haberturk'
    };
    return knownDomains[hostname] ?? hostname;
  } catch {
    return 'Web';
  }
}
