import * as cheerio from 'cheerio';
import type { ExternalPlatform } from '@prisma/client';
import { extractEventsWithAi } from '@/lib/scraper/ai/extract-events';
import { isScraperAiReady } from '@/lib/scraper/ai/config';
import {
  fetchHtml,
  mapCategory,
  parsePrice,
  parseTurkishDate,
  resolveCitySlug
} from '@/lib/scraper/normalize';
import type { ScrapedEventRaw, ScraperAdapter, ScraperResult } from '@/lib/scraper/types';
import { PLATFORM_LABELS, SCRAPER_USER_AGENT } from '@/lib/scraper/types';

function result(
  platform: ExternalPlatform,
  events: ScrapedEventRaw[],
  errors: string[] = []
): ScraperResult {
  return { platform, events, errors };
}

function defaultEndDate(start: Date): Date {
  const end = new Date(start);
  end.setHours(end.getHours() + 3);
  return end;
}

function mapJsonLdEvents(
  platform: ExternalPlatform,
  items: unknown[],
  baseUrl: string
): ScrapedEventRaw[] {
  const events: ScrapedEventRaw[] = [];

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
    const startDate = parseTurkishDate(startRaw) || new Date();
    const endDate =
      parseTurkishDate(String(row.endDate || '')) || defaultEndDate(startDate);

    const location = row.location as Record<string, unknown> | undefined;
    const cityName = String(
      (location?.address as Record<string, unknown>)?.addressLocality ||
        location?.name ||
        'İstanbul'
    );
    const { slug: citySlug } = resolveCitySlug(cityName);
    const venue = String(location?.name || '');
    const address = String(
      (location?.address as Record<string, unknown>)?.streetAddress || ''
    );

    const image = Array.isArray(row.image)
      ? String(row.image[0] || '')
      : String(row.image || '');
    const description = String(row.description || title);
    const offers = row.offers as Record<string, unknown> | undefined;
    const priceText = String(offers?.price || offers?.lowPrice || '');
    const { price, isFree } = parsePrice(priceText);
    const { categorySlug, eventType } = mapCategory(title, description);

    events.push({
      platform,
      externalId,
      externalUrl: externalUrl.startsWith('http')
        ? externalUrl
        : new URL(externalUrl, baseUrl).href,
      title,
      description,
      shortDescription: description.slice(0, 160),
      coverImage:
        image ||
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
      citySlug,
      cityName,
      venue,
      address,
      categorySlug,
      eventType,
      startDate,
      endDate,
      price,
      isFree,
      isOnline: /online|canlı/i.test(`${title} ${description}`),
      tags: [PLATFORM_LABELS[platform]]
    });
  }

  return events;
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
      /* skip invalid json-ld */
    }
  });
  return items;
}

async function scrapeWithJsonLd(
  platform: ExternalPlatform,
  listingUrls: string | string[],
  options?: { aiFirst?: boolean }
): Promise<ScraperResult> {
  const urls = Array.isArray(listingUrls) ? listingUrls : [listingUrls];
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const events: ScrapedEventRaw[] = [];

  for (const listingUrl of urls) {
    try {
      const html = await fetchHtml(listingUrl);
      let pageEvents: ScrapedEventRaw[] = [];

      if (!options?.aiFirst) {
        const ld = extractJsonLd(html);
        pageEvents = mapJsonLdEvents(platform, ld, listingUrl);
      }

      if ((options?.aiFirst || pageEvents.length === 0) && isScraperAiReady()) {
        const ai = await extractEventsWithAi(platform, html, listingUrl);
        if (ai.events.length > 0) {
          pageEvents = ai.events;
          errors.push(
            `${platform} (${listingUrl}): AI parser ile ${ai.events.length} etkinlik`
          );
        } else if (ai.error) {
          errors.push(`${platform}: AI — ${ai.error}`);
        }
      }

      if (pageEvents.length === 0 && !isScraperAiReady()) {
        errors.push(`${platform}: ${listingUrl} — veri bulunamadı (AI kapalı)`);
      }

      for (const ev of pageEvents) {
        const key = `${ev.externalId}:${ev.externalUrl}`;
        if (seenIds.has(key)) continue;
        seenIds.add(key);
        events.push(ev);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${platform}: ${listingUrl} — ${msg}`);
    }
  }

  return result(platform, events, errors);
}

export const biletixAdapter: ScraperAdapter = {
  platform: 'BILETIX',
  label: PLATFORM_LABELS.BILETIX,
  scrapeNewEvents: () =>
    scrapeWithJsonLd(
      'BILETIX',
      [
        'https://www.biletix.com/search/TURKIYE/tr',
        'https://www.biletix.com/search/ISTANBUL/tr',
        'https://www.biletix.com/search/ANKARA/tr',
        'https://www.biletix.com/search/IZMIR/tr',
        'https://www.biletix.com/search/ANTALYA/tr'
      ],
      { aiFirst: true }
    )
};

export const bubiletAdapter: ScraperAdapter = {
  platform: 'BUBILET',
  label: PLATFORM_LABELS.BUBILET,
  scrapeNewEvents: () =>
    scrapeWithJsonLd('BUBILET', [
      'https://www.bubilet.com.tr/',
      'https://www.bubilet.com.tr/istanbul',
      'https://www.bubilet.com.tr/ankara',
      'https://www.bubilet.com.tr/izmir',
      'https://www.bubilet.com.tr/antalya'
    ])
};

export const biletimoAdapter: ScraperAdapter = {
  platform: 'BILETIMO',
  label: PLATFORM_LABELS.BILETIMO,
  scrapeNewEvents: () =>
    scrapeWithJsonLd(
      'BILETIMO',
      [
        'https://www.biletimo.com/',
        'https://www.biletimo.com/etkinlikler',
        'https://www.biletimo.com/istanbul-etkinlikleri',
        'https://www.biletimo.com/ankara-etkinlikleri'
      ],
      { aiFirst: true }
    )
};

export const passoAdapter: ScraperAdapter = {
  platform: 'PASSO',
  label: PLATFORM_LABELS.PASSO,
  scrapeNewEvents: () =>
    scrapeWithJsonLd('PASSO', [
      'https://www.passo.com.tr/tr/etkinlik',
      'https://www.passo.com.tr/tr/etkinlik/istanbul',
      'https://www.passo.com.tr/tr/etkinlik/ankara',
      'https://www.passo.com.tr/tr/etkinlik/izmir'
    ])
};

export const gecceAdapter: ScraperAdapter = {
  platform: 'GECCE',
  label: PLATFORM_LABELS.GECCE,
  scrapeNewEvents: () =>
    scrapeWithJsonLd('GECCE', 'https://gecce.com/')
};

/** Aktif scraper kaynakları — Biletix, Bubilet, Biletimo, Passo */
export const scraperAdapters: ScraperAdapter[] = [
  biletixAdapter,
  bubiletAdapter,
  biletimoAdapter,
  passoAdapter
];

/** Tüm tanımlı adaptörler (geçmiş veri / genişletme için) */
export const allScraperAdapters: ScraperAdapter[] = [
  ...scraperAdapters,
  gecceAdapter
];

export { SCRAPER_USER_AGENT };
