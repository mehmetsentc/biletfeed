import * as cheerio from 'cheerio';
import type { EventStub } from '@/lib/scraper/detail-page';
import { parseScraperDateTime } from '@/lib/scraper/dates';
import { parseTurkishDate } from '@/lib/scraper/normalize';

const BILETIX_HOST = /biletix\.com/i;
const BILETIX_EVENT_PATH =
  /\/(etkinlik|etkinlik-grup)\/([A-Za-z0-9]+)\/([A-Z]+)\/tr(?:\/[^/?#]*)?/i;

function normalizeBiletixDate(raw?: string | null): Date | undefined {
  if (!raw?.trim()) return undefined;
  const fixed = raw.trim().replace(/T(\d{2})::(\d{2})/, 'T$1:$2');
  return (
    parseScraperDateTime(fixed) ||
    parseTurkishDate(fixed) ||
    undefined
  );
}

function normalizeBiletixUrl(href: string, baseUrl: string): string | null {
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
    return null;
  }
  if (href.includes('guides.biletix.com')) return null;

  try {
    const absolute = href.startsWith('http')
      ? href
      : new URL(href, baseUrl).href;
    const url = new URL(absolute.split('#')[0]!);
    if (!BILETIX_HOST.test(url.hostname)) return null;

    const match = url.pathname.match(BILETIX_EVENT_PATH);
    if (!match) return null;

    return `${url.origin}${url.pathname.replace(/\/$/, '')}`;
  } catch {
    return null;
  }
}

function externalIdFromUrl(url: string): string {
  const parts = url.split('/').filter(Boolean);
  const idx = parts.findIndex((p) => p === 'etkinlik' || p === 'etkinlik-grup');
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1]! : parts[parts.length - 1]!;
}

function absoluteImageUrl(image: string, baseUrl: string): string | undefined {
  if (!image?.trim()) return undefined;
  if (image.startsWith('http')) return image;
  try {
    return new URL(image, baseUrl).href;
  } catch {
    return undefined;
  }
}

function addStub(
  map: Map<string, EventStub>,
  partial: Omit<EventStub, 'platform'> & { platform?: 'BILETIX' }
): void {
  const externalUrl = normalizeBiletixUrl(partial.externalUrl, partial.externalUrl);
  if (!externalUrl) return;

  const existing = map.get(externalUrl);
  map.set(externalUrl, {
    platform: 'BILETIX',
    externalId: partial.externalId || externalIdFromUrl(externalUrl),
    externalUrl,
    title: partial.title || existing?.title,
    coverImage: partial.coverImage || existing?.coverImage,
    startDate: partial.startDate || existing?.startDate
  });
}

function extractEmbeddedJsonStubs(
  html: string,
  baseUrl: string,
  map: Map<string, EventStub>
): void {
  const objectPattern =
    /\{[^{}]*"link"\s*:\s*"([^"]*(?:\/etkinlik\/|\/etkinlik-grup\/)[^"]*)"[^{}]*"name"\s*:\s*"([^"]+)"[^{}]*\}/g;

  for (const match of html.matchAll(objectPattern)) {
    const url = normalizeBiletixUrl(match[1]!, baseUrl);
    if (!url) continue;

    const imageMatch = match[0].match(
      /"imageurl"\s*:\s*"([^"]+)"|"smallImageurl"\s*:\s*"([^"]+)"/
    );
    const image = imageMatch?.[1] || imageMatch?.[2];

    addStub(map, {
      externalUrl: url,
      externalId: externalIdFromUrl(url),
      title: match[2]!.replace(/\\r\\n/g, '').trim(),
      coverImage: image ? absoluteImageUrl(image, baseUrl) : undefined
    });
  }

  const linkPattern =
    /"link"\s*:\s*"((?:https?:\/\/www\.biletix\.com)?\/(?:etkinlik|etkinlik-grup)\/[^"]+)"/gi;
  for (const match of html.matchAll(linkPattern)) {
    const url = normalizeBiletixUrl(match[1]!, baseUrl);
    if (!url) continue;
    addStub(map, { externalUrl: url, externalId: externalIdFromUrl(url) });
  }
}

function extractMicrodataStubs(
  $: cheerio.CheerioAPI,
  baseUrl: string,
  map: Map<string, EventStub>
): void {
  $('.htevent').each((_, el) => {
    const $el = $(el);
    const startRaw = $el.find('[itemprop="startDate"]').attr('content') || '';
    const startDate = normalizeBiletixDate(startRaw);

    const title =
      $el.find('[itemprop="name"]').first().text().trim() ||
      $el.find('.ln1 a').first().text().trim() ||
      $el.find('.ln1').first().text().trim();

    const href =
      $el.find('a[itemprop="url"]').attr('href') ||
      $el.find('.ln1 a').attr('href') ||
      $el.attr('onclick')?.match(/window\.location='([^']+)'/)?.[1];

    if (!href) return;

    const url = normalizeBiletixUrl(href, baseUrl);
    if (!url) return;

    addStub(map, {
      externalUrl: url,
      externalId: externalIdFromUrl(url),
      title: title || undefined,
      startDate
    });
  });
}

function extractAnchorStubs(
  $: cheerio.CheerioAPI,
  baseUrl: string,
  map: Map<string, EventStub>
): void {
  $('a[href*="/etkinlik/"], a[href*="/etkinlik-grup/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const url = normalizeBiletixUrl(href, baseUrl);
    if (!url) return;

    const title = $(el).text().trim() || $(el).attr('title') || undefined;
    addStub(map, {
      externalUrl: url,
      externalId: externalIdFromUrl(url),
      title: title && title.length > 1 ? title : undefined
    });
  });
}

/** Biletix liste/anasayfa/kategori sayfalarından etkinlik stub'ları üretir. */
export function extractBiletixListingStubs(
  html: string,
  listingUrl: string
): EventStub[] {
  const $ = cheerio.load(html);
  const map = new Map<string, EventStub>();

  extractMicrodataStubs($, listingUrl, map);
  extractEmbeddedJsonStubs(html, listingUrl, map);
  extractAnchorStubs($, listingUrl, map);

  return [...map.values()];
}

export function isFutureBiletixStub(stub: EventStub, now = new Date()): boolean {
  if (!stub.startDate) return true;
  return stub.startDate.getTime() >= now.getTime() - 12 * 60 * 60 * 1000;
}
