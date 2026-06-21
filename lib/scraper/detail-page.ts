import * as cheerio from 'cheerio';
import type { ExternalPlatform, EventType } from '@prisma/client';
import { inferEventEndDate, parseScraperDateTime } from '@/lib/scraper/dates';
import { isPlaceholderImage, pickBestImage } from '@/lib/scraper/image-utils';
import {
  fetchHtml,
  mapCategory,
  parsePrice,
  parseTurkishDate,
  resolveCitySlug
} from '@/lib/scraper/normalize';
import { PLATFORM_LABELS } from '@/lib/scraper/types';
import type { ScrapedEventRaw } from '@/lib/scraper/types';

export interface EventStub {
  platform: ExternalPlatform;
  externalId: string;
  externalUrl: string;
  title?: string;
  coverImage?: string;
  startDate?: Date;
}

function meta($: cheerio.CheerioAPI, key: string): string {
  return (
    $(`meta[property="${key}"]`).attr('content') ||
    $(`meta[name="${key}"]`).attr('content') ||
    ''
  ).trim();
}

function extractJsonLdEvent(html: string): Record<string, unknown> | null {
  const $ = cheerio.load(html);
  let found: Record<string, unknown> | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    if (found) return;
    try {
      const json = JSON.parse($(el).html() || '');
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const row = item as Record<string, unknown>;
        const type = row['@type'];
        if (type === 'Event' || type === 'MusicEvent') {
          found = row;
          return false;
        }
        const graph = row['@graph'];
        if (Array.isArray(graph)) {
          for (const g of graph) {
            if (g?.['@type'] === 'Event' || g?.['@type'] === 'MusicEvent') {
              found = g as Record<string, unknown>;
              return false;
            }
          }
        }
      }
    } catch {
      /* skip */
    }
  });

  return found;
}

function parseLocation(ld: Record<string, unknown>) {
  const location = ld.location as Record<string, unknown> | undefined;
  const address = location?.address as Record<string, unknown> | undefined;
  return {
    venue: String(location?.name || '').trim(),
    address: String(address?.streetAddress || address?.name || '').trim(),
    cityName: String(
      address?.addressLocality || address?.addressRegion || location?.name || ''
    ).trim()
  };
}

function parseImages(ld: Record<string, unknown>, ogImage: string): {
  cover: string;
  gallery: string[];
} {
  const raw = ld.image;
  const fromLd: string[] = [];
  if (typeof raw === 'string') fromLd.push(raw);
  else if (Array.isArray(raw)) {
    for (const img of raw) {
      if (typeof img === 'string') fromLd.push(img);
      else if (img && typeof img === 'object' && 'url' in img) {
        fromLd.push(String((img as { url: string }).url));
      }
    }
  }

  const gallery = [...new Set(fromLd.filter((u) => u.startsWith('http')))];
  const cover = pickBestImage(ogImage, gallery[0]) || ogImage;
  return { cover, gallery };
}

export function parseDetailPageHtml(
  html: string,
  pageUrl: string,
  platform: ExternalPlatform,
  stub?: EventStub
): ScrapedEventRaw | null {
  const $ = cheerio.load(html);
  const ld = extractJsonLdEvent(html);

  const ogTitle = meta($, 'og:title');
  const ogDesc = meta($, 'og:description') || meta($, 'description');
  const ogImage = meta($, 'og:image');

  const title = String(ld?.name || ogTitle || stub?.title || $('h1').first().text())
    .trim()
    .replace(/\s+/g, ' ');
  if (!title || title.length < 2) return null;

  const externalUrl = String(ld?.url || pageUrl).trim();
  const externalId =
    stub?.externalId ||
    externalUrl.split('/').filter(Boolean).pop() ||
    title.slice(0, 40).replace(/\s+/g, '-');

  const startRaw = String(ld?.startDate || ld?.startTime || '');
  const startDate =
    parseScraperDateTime(startRaw) ||
    stub?.startDate ||
    parseTurkishDate(startRaw);
  if (!startDate) return null;

  const endDate = inferEventEndDate(
    startDate,
    String(ld?.endDate || ld?.endTime || '')
  );

  const loc = parseLocation(ld || {});
  const { slug: citySlug, name: cityName } = resolveCitySlug(loc.cityName || 'İstanbul');

  const { cover, gallery } = parseImages(ld || {}, ogImage || stub?.coverImage || '');
  const description = String(
    ld?.description || ogDesc || title
  )
    .trim()
    .replace(/\s+/g, ' ');

  const offers = ld?.offers as Record<string, unknown> | undefined;
  const priceText = String(
    offers?.price || offers?.lowPrice || offers?.highPrice || ''
  );
  const { price, isFree } = parsePrice(priceText);
  const { categorySlug, eventType } = mapCategory(title, description);

  const tags = [PLATFORM_LABELS[platform]];
  if (isPlaceholderImage(cover)) tags.push('eksik-gorsel');
  if (description.length < 40) tags.push('eksik-aciklama');

  return {
    platform,
    externalId,
    externalUrl: externalUrl.startsWith('http')
      ? externalUrl
      : new URL(externalUrl, pageUrl).href,
    title,
    description,
    shortDescription: description.slice(0, 160),
    coverImage: cover || stub?.coverImage || '',
    gallery,
    citySlug,
    cityName: loc.cityName || cityName,
    venue: loc.venue,
    address: loc.address,
    categorySlug,
    eventType: eventType as EventType,
    startDate,
    endDate,
    price,
    isFree,
    isOnline: /online|canlı/i.test(`${title} ${description}`),
    tags
  };
}

export async function enrichEventFromDetailPage(
  stub: EventStub
): Promise<ScrapedEventRaw | null> {
  try {
    const html = await fetchHtml(stub.externalUrl, 25000);
    const parsed = parseDetailPageHtml(html, stub.externalUrl, stub.platform, stub);
    return parsed;
  } catch {
    if (!stub.title || !stub.startDate) return null;
    const { slug: citySlug, name: cityName } = resolveCitySlug('İstanbul');
    const description = stub.title;
    const { categorySlug, eventType } = mapCategory(stub.title, description);
    return {
      platform: stub.platform,
      externalId: stub.externalId,
      externalUrl: stub.externalUrl,
      title: stub.title,
      description,
      shortDescription: description.slice(0, 160),
      coverImage: stub.coverImage || '',
      gallery: [],
      citySlug,
      cityName,
      venue: '',
      address: '',
      categorySlug,
      eventType: eventType as EventType,
      startDate: stub.startDate,
      endDate: inferEventEndDate(stub.startDate),
      price: 0,
      isFree: true,
      tags: [PLATFORM_LABELS[stub.platform], 'eksik-gorsel', 'eksik-aciklama']
    };
  }
}

async function mapConcurrent<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 4
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    out.push(...(await Promise.all(batch.map(fn))));
  }
  return out;
}

export async function enrichStubsWithDetails(
  stubs: EventStub[],
  maxDetails = 80
): Promise<{ events: ScrapedEventRaw[]; errors: string[] }> {
  const unique = new Map<string, EventStub>();
  for (const s of stubs) {
    unique.set(s.externalUrl, s);
  }

  const list = [...unique.values()].slice(0, maxDetails);
  const errors: string[] = [];

  const results = await mapConcurrent(list, async (stub) => {
    const event = await enrichEventFromDetailPage(stub);
    if (!event) errors.push(`Detay alınamadı: ${stub.externalUrl}`);
    return event;
  });

  const events = results.filter((e): e is ScrapedEventRaw => e !== null);
  return { events, errors };
}
