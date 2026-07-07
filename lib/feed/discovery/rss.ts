/**
 * RSS feed çekme ve ayrıştırma — müzik/etkinlik haberleri
 */
import type { DiscoveredItem } from '@/lib/feed/ai-editor';
import type { RssSource } from './sources';

interface RssItem {
  title: string;
  link: string;
  description: string;
}

/** Basit RSS XML ayrıştırıcı — cheerio gerektirmez */
function parseRssXml(xml: string): RssItem[] {
  const items: RssItem[] = [];

  // <item> bloklarını çıkar
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link') || extractTag(block, 'guid');
    const description =
      extractTag(block, 'description') ||
      extractTag(block, 'summary') ||
      extractTag(block, 'content:encoded');

    if (title && link) {
      items.push({
        title: stripHtml(title),
        link: link.trim(),
        description: stripHtml(description).slice(0, 600)
      });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  // CDATA içeriğini de yakala
  const cdataRe = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`,
    'i'
  );
  const plainRe = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i');

  const cdata = cdataRe.exec(xml);
  if (cdata) return cdata[1].trim();

  const plain = plainRe.exec(xml);
  if (plain) return plain[1].trim();

  return '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tek bir RSS kaynağını çek */
async function fetchRssFeed(source: RssSource): Promise<RssItem[]> {
  const response = await fetch(source.url, {
    headers: { 'User-Agent': 'BiletFeed-Bot/1.0 (news aggregator)' },
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    throw new Error(`RSS ${response.status}: ${source.url}`);
  }

  const xml = await response.text();
  return parseRssXml(xml);
}

/**
 * Tüm RSS kaynaklarını çek, DiscoveredItem listesi döndür.
 * İlgisiz başlıkları basit anahtar kelime filtresiyle eler.
 */
export async function discoverViaRss(
  sources: RssSource[]
): Promise<{ items: DiscoveredItem[]; errors: string[] }> {
  const items: DiscoveredItem[] = [];
  const errors: string[] = [];

  // Müzik/etkinlik ile ilgili anahtar kelimeler
  const MUSIC_KEYWORDS = [
    'konser', 'concert', 'festival', 'sahne', 'müzik', 'music',
    'sanatçı', 'artist', 'bilet', 'ticket', 'tour', 'turne',
    'dj', 'live', 'band', 'rock', 'pop', 'electronic', 'party',
    'albüm', 'album', 'single', 'gig', 'show', 'performance',
    'etkinlik', 'event', 'club', 'venue', 'mekân'
  ];

  for (const source of sources) {
    try {
      const rssItems = await fetchRssFeed(source);

      for (const item of rssItems.slice(0, 10)) {
        const text = `${item.title} ${item.description}`.toLowerCase();
        const isRelevant = MUSIC_KEYWORDS.some((kw) => text.includes(kw));
        if (!isRelevant) continue;

        items.push({
          sourceUrl: item.link,
          sourceTitle: item.title,
          sourceSnippet: item.description || undefined,
          sourceName: source.name
        });
      }
    } catch (err) {
      errors.push(
        `RSS hatası (${source.name}): ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Kaynaklar arası 200ms gecikme
    await new Promise((r) => setTimeout(r, 200));
  }

  return { items, errors };
}
