import * as cheerio from 'cheerio';
import type { ExternalPlatform } from '@prisma/client';
import { extractEventsWithAi } from '@/lib/scraper/ai/extract-events';
import { isScraperAiReady } from '@/lib/scraper/ai/config';
import {
  enrichStubsWithDetails,
  type EventStub
} from '@/lib/scraper/detail-page';
import { parseScraperDateTime } from '@/lib/scraper/dates';
import {
  fetchHtml,
  parseTurkishDate
} from '@/lib/scraper/normalize';
import type { ScrapedEventRaw, ScraperAdapter, ScraperResult } from '@/lib/scraper/types';
import { PLATFORM_LABELS } from '@/lib/scraper/types';

function result(
  platform: ExternalPlatform,
  events: ScrapedEventRaw[],
  errors: string[] = []
): ScraperResult {
  return { platform, events, errors };
}

function isEventDetailUrl(url: string, platform: ExternalPlatform): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    if (/\.(pdf|jpg|jpeg|png|svg|webp)$/i.test(path)) return false;
    if (u.hostname.startsWith('guides.')) return false;

    if (platform === 'BILETIX') {
      return (
        path.includes('/performance/') &&
        !path.includes('/search/') &&
        !path.includes('/category/') &&
        !path.includes('/static/')
      );
    }
    if (platform === 'BUBILET') {
      const parts = path.split('/').filter(Boolean);
      const cities = new Set([
        'istanbul',
        'ankara',
        'izmir',
        'antalya',
        'bursa',
        'eskisehir'
      ]);
      return parts.length >= 2 && !cities.has(parts[parts.length - 1]!);
    }
    if (platform === 'BILETIMO') {
      const parts = path.split('/').filter(Boolean);
      return (
        parts.length >= 2 &&
        !['etkinlikler', 'istanbul-etkinlikleri', 'ankara-etkinlikleri'].includes(
          parts[parts.length - 1]!
        )
      );
    }
    return false;
  } catch {
    return false;
  }
}
function collectLinksFromHtml(
  html: string,
  baseUrl: string,
  hostPattern: RegExp,
  platform: ExternalPlatform
): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    try {
      const absolute = href.startsWith('http')
        ? href
        : new URL(href, baseUrl).href;
      if (
        hostPattern.test(absolute) &&
        absolute !== baseUrl &&
        isEventDetailUrl(absolute, platform)
      ) {
        links.add(absolute.split('#')[0]!);
      }
    } catch {
      /* skip */
    }
  });

  return [...links];
}

function mapJsonLdStubs(
  platform: ExternalPlatform,
  items: unknown[],
  baseUrl: string
): EventStub[] {
  const stubs: EventStub[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (row['@type'] !== 'Event' && row['@type'] !== 'MusicEvent') continue;

    const title = String(row.name || '').trim();
    if (!title) continue;

    const externalUrl = String(row.url || baseUrl).trim();
    const externalId =
      externalUrl.split('/').filter(Boolean).pop() ||
      title.slice(0, 32).replace(/\s+/g, '-');

    const startRaw = String(row.startDate || row.startTime || '');
    const startDate =
      parseScraperDateTime(startRaw) || parseTurkishDate(startRaw) || undefined;

    const image = Array.isArray(row.image)
      ? String(row.image[0] || '')
      : String(row.image || '');

    stubs.push({
      platform,
      externalId,
      externalUrl: externalUrl.startsWith('http')
        ? externalUrl
        : new URL(externalUrl, baseUrl).href,
      title,
      coverImage: image.startsWith('http') ? image : undefined,
      startDate
    });
  }

  return stubs;
}

function extractJsonLd(html: string): unknown[] {
  const $ = cheerio.load(html);
  const items: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '');
      if (Array.isArray(json)) items.push(...json);
      else items.push(json);
    } catch {
      /* skip */
    }
  });
  return items;
}

async function scrapePlatformWithDetails(
  platform: ExternalPlatform,
  listingUrls: string[],
  hostPattern: RegExp,
  options?: { aiFirst?: boolean; maxDetails?: number }
): Promise<ScraperResult> {
  const errors: string[] = [];
  const stubMap = new Map<string, EventStub>();
  const aiEventByUrl = new Map<string, ScrapedEventRaw>();

  for (const listingUrl of listingUrls) {
    try {
      const html = await fetchHtml(listingUrl);

      if (!options?.aiFirst) {
        const ld = extractJsonLd(html);
        for (const stub of mapJsonLdStubs(platform, ld, listingUrl)) {
          stubMap.set(stub.externalUrl, stub);
        }
      }

      if (isScraperAiReady() && (options?.aiFirst || stubMap.size === 0)) {
        const ai = await extractEventsWithAi(platform, html, listingUrl);
        if (ai.events.length > 0) {
          for (const ev of ai.events) {
            aiEventByUrl.set(ev.externalUrl, ev);
            stubMap.set(ev.externalUrl, {
              platform,
              externalId: ev.externalId,
              externalUrl: ev.externalUrl,
              title: ev.title,
              coverImage: ev.coverImage,
              startDate: ev.startDate
            });
          }
          errors.push(
            `${platform}: ${listingUrl} — AI ${ai.events.length} etkinlik`
          );
        } else if (ai.error) {
          errors.push(`${platform}: AI — ${ai.error}`);
        }
      }

      for (const link of collectLinksFromHtml(
        html,
        listingUrl,
        hostPattern,
        platform
      )) {
        if (stubMap.has(link)) continue;
        stubMap.set(link, {
          platform,
          externalId: link.split('/').filter(Boolean).pop() || link,
          externalUrl: link
        });
      }
    } catch (e) {
      errors.push(
        `${platform}: ${listingUrl} — ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  if (stubMap.size === 0) {
    errors.push(`${platform}: liste sayfasında etkinlik bulunamadı`);
    return result(platform, [], errors);
  }

  const stubsForDetail = [...stubMap.values()].filter((s) =>
    isEventDetailUrl(s.externalUrl, platform)
  );

  const { events: enriched, errors: detailErrors } = await enrichStubsWithDetails(
    stubsForDetail.length > 0 ? stubsForDetail : [...stubMap.values()],
    options?.maxDetails ?? 80
  );
  errors.push(...detailErrors);

  const enrichedUrls = new Set(enriched.map((e) => e.externalUrl));
  for (const [url, aiEv] of aiEventByUrl) {
    if (!enrichedUrls.has(url) && aiEv.title && aiEv.startDate) {
      enriched.push(aiEv);
    }
  }

  const valid = enriched.filter(
    (e) => e.title && e.startDate && !Number.isNaN(e.startDate.getTime())
  );

  errors.push(
    `${platform}: ${stubMap.size} kaynak, ${valid.length} etkinlik işlendi`
  );

  return result(platform, valid, errors);
}

export const biletixAdapter: ScraperAdapter = {
  platform: 'BILETIX',
  label: PLATFORM_LABELS.BILETIX,
  scrapeNewEvents: () =>
    scrapePlatformWithDetails(
      'BILETIX',
      [
        'https://www.biletix.com/search/TURKIYE/tr',
        'https://www.biletix.com/search/ISTANBUL/tr',
        'https://www.biletix.com/search/ANKARA/tr',
        'https://www.biletix.com/search/IZMIR/tr',
        'https://www.biletix.com/search/ANTALYA/tr'
      ],
      /biletix\.com/i,
      { aiFirst: true, maxDetails: 60 }
    )
};

export const bubiletAdapter: ScraperAdapter = {
  platform: 'BUBILET',
  label: PLATFORM_LABELS.BUBILET,
  scrapeNewEvents: () =>
    scrapePlatformWithDetails(
      'BUBILET',
      [
        'https://www.bubilet.com.tr/',
        'https://www.bubilet.com.tr/istanbul',
        'https://www.bubilet.com.tr/ankara',
        'https://www.bubilet.com.tr/izmir',
        'https://www.bubilet.com.tr/antalya'
      ],
      /bubilet\.com\.tr/i,
      { maxDetails: 80 }
    )
};

export const biletimoAdapter: ScraperAdapter = {
  platform: 'BILETIMO',
  label: PLATFORM_LABELS.BILETIMO,
  scrapeNewEvents: () =>
    scrapePlatformWithDetails(
      'BILETIMO',
      [
        'https://www.biletimo.com/',
        'https://www.biletimo.com/etkinlikler',
        'https://www.biletimo.com/istanbul-etkinlikleri',
        'https://www.biletimo.com/ankara-etkinlikleri',
        'https://www.biletimo.com/izmir-etkinlikleri'
      ],
      /biletimo\.com/i,
      { aiFirst: true, maxDetails: 60 }
    )
};

/** Aktif scraper kaynakları — yalnızca Bubilet, Biletix, Biletimo */
export const scraperAdapters: ScraperAdapter[] = [
  bubiletAdapter,
  biletixAdapter,
  biletimoAdapter
];

export { SCRAPER_USER_AGENT } from '@/lib/scraper/types';
