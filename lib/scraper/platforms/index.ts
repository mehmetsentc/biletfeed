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
import {
  biletixListingUrls,
  bubiletListingUrls,
  biletimoListingUrls,
  biletinoListingUrls
} from '@/lib/scraper/listing-urls';
import {
  extractBiletixListingStubs,
  isFutureBiletixStub
} from '@/lib/scraper/platforms/biletix';
import { extractBiletinoProductStubs } from '@/lib/scraper/platforms/biletino';
import { scrapePasso } from '@/lib/scraper/platforms/passo';
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
      // Etkinlik URL formatları: /etkinlik/{ID}/TURKIYE/tr ve /etkinlik-grup/{ID}/TURKIYE/tr
      if (path.includes('/search/') || path.includes('/category/') ||
          path.includes('/static/') || path.includes('/anasayfa/') ||
          path.includes('/yardim/') || path.includes('/mekan/') ||
          path.includes('/hediyekart/') || path.includes('/cart/') ||
          path.includes('/auth/') || path.includes('/myaccount/') ||
          u.hostname.startsWith('guides.') || u.hostname.startsWith('blog.')) {
        return false;
      }
      return (
        path.includes('/etkinlik/') ||
        path.includes('/etkinlik-grup/') ||
        path.includes('/performance/')
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
      if (
        path.includes('/mekan/') ||
        path.includes('/etiket/') ||
        path.includes('/sayfa/') ||
        path.includes('/profil/')
      ) {
        return false;
      }
      return parts.length >= 2 && !cities.has(parts[parts.length - 1]!);
    }
    if (platform === 'BILETIMO') {
      const parts = path.split('/').filter(Boolean);
      const blocked = new Set([
        'etkinlikler',
        'istanbul-etkinlikleri',
        'ankara-etkinlikleri',
        'izmir-etkinlikleri',
        'antalya-etkinlikleri',
        'bursa-etkinlikleri'
      ]);
      if (path.includes('/sayfa/') || path.includes('/blog/')) return false;
      return parts.length >= 2 && !blocked.has(parts[parts.length - 1]!);
    }
    if (platform === 'PASSO') {
      const parts = path.split('/').filter(Boolean);
      const blocked = new Set([
        'etkinlikler', 'konserler', 'tiyatro-dansopera', 'spor',
        'festivaller', 'istanbul', 'ankara', 'izmir', 'antalya',
        'bursa', 'eskisehir', 'adana', 'gaziantep', 'kayseri',
        'konya', 'mersin', 'trabzon', 'samsun', 'bodrum', 'mugla', 'alanya'
      ]);
      if (path.includes('/sepet') || path.includes('/giris') || path.includes('/uye')) return false;
      const lastPart = parts[parts.length - 1] ?? '';
      if (blocked.has(lastPart)) return false;
      return parts.length >= 1 && (
        path.includes('/etkinlik/') ||
        path.includes('/bilet/') ||
        path.includes('/e/') ||
        /\/[a-z0-9-]+-\d+$/.test(path) ||
        (parts.length >= 2 && !blocked.has(parts[0]!))
      );
    }
    if (platform === 'BILETINO') {
      if (
        path.includes('/search/') ||
        path.includes('/city/') ||
        path.includes('/content/') ||
        path.includes('/account/') ||
        path.includes('/category/') ||
        path.includes('/giris') ||
        path.includes('/kayit') ||
        path.includes('/sepet')
      ) {
        return false;
      }
      return /\/tr\/e-[a-z0-9]+\/[^/]+\/?$/i.test(path);
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
  options?: {
    aiFirst?: boolean;
    maxDetails?: number;
    extractStubs?: (html: string, listingUrl: string) => EventStub[];
  }
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

      if (options?.extractStubs) {
        for (const stub of options.extractStubs(html, listingUrl)) {
          const existing = stubMap.get(stub.externalUrl);
          stubMap.set(stub.externalUrl, existing ? { ...existing, ...stub } : stub);
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

async function scrapeBiletix(): Promise<ScraperResult> {
  try {
    const probe = await fetchHtml('https://www.biletix.com/anasayfa/TURKIYE/tr', 12000);
    if (!probe || probe.length < 5000) {
      return result('BILETIX', [], ['BILETIX: site yanıt vermedi veya erişilemedi']);
    }
  } catch (e) {
    return result('BILETIX', [], [
      `BILETIX: site erişilemedi — ${e instanceof Error ? e.message : String(e)}`
    ]);
  }

  const scraped = await scrapePlatformWithDetails(
    'BILETIX',
    biletixListingUrls(),
    /biletix\.com/i,
    {
      aiFirst: false,
      maxDetails: 600,
      extractStubs: (html, url) =>
        extractBiletixListingStubs(html, url).filter(isFutureBiletixStub)
    }
  );

  const now = new Date();
  const events = scraped.events.filter(
    (event) => event.startDate.getTime() >= now.getTime() - 12 * 60 * 60 * 1000
  );

  return {
    platform: 'BILETIX',
    events,
    errors: [
      ...scraped.errors,
      `BILETIX: ${events.length} gelecek etkinlik (${scraped.events.length} toplam çekildi)`
    ]
  };
}

export const biletixAdapter: ScraperAdapter = {
  platform: 'BILETIX',
  label: PLATFORM_LABELS.BILETIX,
  scrapeNewEvents: scrapeBiletix
};

export const bubiletAdapter: ScraperAdapter = {
  platform: 'BUBILET',
  label: PLATFORM_LABELS.BUBILET,
  scrapeNewEvents: () =>
    scrapePlatformWithDetails(
      'BUBILET',
      bubiletListingUrls(),
      /bubilet\.com\.tr/i,
      { maxDetails: 100 }
    )
};

async function scrapeBiletimo(): Promise<ScraperResult> {
  try {
    const probe = await fetchHtml('https://www.biletimo.com/', 12000);
    if (/hugedomains|is for sale|domain_profile/i.test(probe)) {
      return result('BILETIMO', [], [
        'BILETIMO: biletimo.com alan adı satışta — etkinlik kaynağı şu an kullanılamıyor'
      ]);
    }
  } catch (e) {
    return result('BILETIMO', [], [
      `BILETIMO: site erişilemedi — ${e instanceof Error ? e.message : String(e)}`
    ]);
  }

  return scrapePlatformWithDetails(
    'BILETIMO',
    biletimoListingUrls(),
    /biletimo\.com/i,
    { aiFirst: true, maxDetails: 80 }
  );
}

export const biletimoAdapter: ScraperAdapter = {
  platform: 'BILETIMO',
  label: PLATFORM_LABELS.BILETIMO,
  scrapeNewEvents: scrapeBiletimo
};

export const passoAdapter: ScraperAdapter = {
  platform: 'PASSO',
  label: PLATFORM_LABELS.PASSO,
  scrapeNewEvents: scrapePasso  // API-based scraper (Angular SPA, no HTML scraping)
};

async function scrapeBiletino(): Promise<ScraperResult> {
  try {
    const probe = await fetchHtml('https://biletino.com/tr/turkiye/', 12000);
    if (!probe || probe.length < 500) {
      return result('BILETINO', [], ['BILETINO: site yanıt vermedi veya erişilemedi']);
    }
  } catch (e) {
    return result('BILETINO', [], [
      `BILETINO: site erişilemedi — ${e instanceof Error ? e.message : String(e)}`
    ]);
  }

  return scrapePlatformWithDetails(
    'BILETINO',
    biletinoListingUrls(),
    /biletino\.com/i,
    {
      aiFirst: false,
      maxDetails: 100,
      extractStubs: extractBiletinoProductStubs
    }
  );
}

export const biletinoAdapter: ScraperAdapter = {
  platform: 'BILETINO',
  label: PLATFORM_LABELS.BILETINO,
  scrapeNewEvents: scrapeBiletino
};

/** Aktif scraper kaynakları */
export const scraperAdapters: ScraperAdapter[] = [
  bubiletAdapter,
  biletixAdapter,
  biletimoAdapter,
  passoAdapter,
  biletinoAdapter
];

export { SCRAPER_USER_AGENT } from '@/lib/scraper/types';
