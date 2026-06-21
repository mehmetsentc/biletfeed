import * as cheerio from 'cheerio';
import type { ExternalPlatform, EventType } from '@prisma/client';
import { scraperAiChat } from '@/lib/scraper/ai/client';
import { getScraperAiConfig, isScraperAiReady } from '@/lib/scraper/ai/config';
import {
  mapCategory,
  parsePrice,
  parseTurkishDate,
  resolveCitySlug
} from '@/lib/scraper/normalize';
import { PLATFORM_LABELS } from '@/lib/scraper/types';
import type { ScrapedEventRaw } from '@/lib/scraper/types';

interface AiEventRow {
  externalId?: string;
  externalUrl?: string;
  title?: string;
  description?: string;
  coverImage?: string;
  cityName?: string;
  venue?: string;
  address?: string;
  startDate?: string;
  endDate?: string;
  price?: number | string;
  priceText?: string;
  isFree?: boolean;
  isOnline?: boolean;
  categoryHint?: string;
}

interface AiExtractResponse {
  events?: AiEventRow[];
}

const SYSTEM_PROMPT = `Sen Bilet Feed platformu için Türkiye etkinlik verisi çıkaran bir ajansın.
Görev: bilet sitelerinin HTML özetinden yapılandırılmış etkinlik listesi üret.

Kurallar:
- Sadece geçerli JSON döndür: {"events":[...]}
- Her etkinlik için mutlaka: title, externalUrl, startDate (ISO 8601), cityName
- externalUrl tam https URL olmalı, göreli path ise base URL ile birleştir
- externalId: URL'deki benzersiz slug veya id
- Fiyat yoksa isFree: true, price: 0
- Türkiye şehirleri kullan (İstanbul, Ankara, İzmir vb.)
- Gelecek etkinlikleri tercih et
- En fazla 40 etkinlik döndür
- Uydurma etkinlik ekleme; HTML'de olmayan veri üretme`;

function prepareHtmlSnapshot(html: string, listingUrl: string): string {
  const cfg = getScraperAiConfig();
  const $ = cheerio.load(html);

  $('script, style, noscript, svg, iframe').remove();

  const links: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (!text || text.length < 3) return;
    if (
      /etkinlik|event|konser|bilet|festival|tiyatro|passo|biletix/i.test(
        `${href} ${text}`
      )
    ) {
      try {
        const absolute = href.startsWith('http')
          ? href
          : new URL(href, listingUrl).href;
        links.push(`${text} → ${absolute}`);
      } catch {
        /* skip bad urls */
      }
    }
  });

  const images: string[] = [];
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    if (src.startsWith('http') && alt.length > 2) {
      images.push(`${alt} → ${src}`);
    }
  });

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

  const payload = {
    sourceUrl: listingUrl,
    eventLinks: [...new Set(links)].slice(0, 120),
    images: [...new Set(images)].slice(0, 40),
    pageText: bodyText.slice(0, cfg.maxHtmlChars)
  };

  return JSON.stringify(payload);
}

function mapAiRow(
  platform: ExternalPlatform,
  row: AiEventRow,
  listingUrl: string
): ScrapedEventRaw | null {
  const title = row.title?.trim();
  if (!title) return null;

  let externalUrl = row.externalUrl?.trim() || listingUrl;
  try {
    if (!externalUrl.startsWith('http')) {
      externalUrl = new URL(externalUrl, listingUrl).href;
    }
  } catch {
    return null;
  }

  const externalId =
    row.externalId?.trim() ||
    externalUrl.split('/').filter(Boolean).pop() ||
    title.slice(0, 40).replace(/\s+/g, '-');

  const startDate =
    parseTurkishDate(row.startDate) ||
    (row.startDate ? new Date(row.startDate) : null);
  if (!startDate || Number.isNaN(startDate.getTime())) {
    return null;
  }

  const endDate =
    parseTurkishDate(row.endDate) ||
    (row.endDate ? new Date(row.endDate) : null) ||
    new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const { slug: citySlug, name: cityName } = resolveCitySlug(
    row.cityName || 'İstanbul'
  );

  const priceParsed =
    typeof row.price === 'number'
      ? { price: row.price, isFree: row.price === 0 }
      : parsePrice(row.priceText || String(row.price || ''));

  const isFree = row.isFree ?? priceParsed.isFree;
  const price = isFree ? 0 : priceParsed.price;

  const description = row.description?.trim() || title;
  const hints = [row.categoryHint || '', title, description];
  const { categorySlug, eventType } = mapCategory(title, description, hints);

  return {
    platform,
    externalId,
    externalUrl,
    title,
    description,
    shortDescription: description.slice(0, 160),
    coverImage:
      row.coverImage?.startsWith('http')
        ? row.coverImage
        : 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    citySlug,
    cityName: row.cityName || cityName,
    venue: row.venue || '',
    address: row.address || '',
    categorySlug,
    eventType: eventType as EventType,
    startDate,
    endDate,
    price,
    isFree,
    isOnline: row.isOnline ?? /online|canlı/i.test(`${title} ${description}`),
    tags: [PLATFORM_LABELS[platform], 'ai-extracted']
  };
}

export async function extractEventsWithAi(
  platform: ExternalPlatform,
  html: string,
  listingUrl: string
): Promise<{ events: ScrapedEventRaw[]; error?: string }> {
  if (!isScraperAiReady()) {
    return {
      events: [],
      error:
        'AI scraper kapalı veya API anahtarı yok (AI_ENABLED + DEEPSEEK_API_KEY veya GEMINI_API_KEY)'
    };
  }

  try {
    const snapshot = prepareHtmlSnapshot(html, listingUrl);
    const userPrompt = `Platform: ${PLATFORM_LABELS[platform]}
Liste URL: ${listingUrl}

Aşağıdaki JSON HTML özetinden etkinlikleri çıkar:

${snapshot}`;

    const raw = await scraperAiChat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      { jsonMode: true, temperature: 0.05 }
    );

    let parsed: AiExtractResponse;
    try {
      parsed = JSON.parse(raw) as AiExtractResponse;
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('AI JSON parse hatası');
      parsed = JSON.parse(match[0]) as AiExtractResponse;
    }

    const events = (parsed.events || [])
      .map((row) => mapAiRow(platform, row, listingUrl))
      .filter((e): e is ScrapedEventRaw => e !== null);

    return { events };
  } catch (e) {
    return {
      events: [],
      error: e instanceof Error ? e.message : String(e)
    };
  }
}

export { isScraperAiReady };
