import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import type { EventStub } from '@/lib/scraper/detail-page';
import { parseTurkishDate } from '@/lib/scraper/normalize';

const BILETINO_EVENT_PATH = /\/tr\/e-[a-z0-9]+\/[^/?#]+/i;
const BILETINO_IMAGE_BASE =
  'https://resources-biletino.s3.eu-west-1.amazonaws.com/content/event';

const TR_MONTHS: Record<string, number> = {
  ocak: 0,
  şubat: 1,
  subat: 1,
  mart: 2,
  nisan: 3,
  mayıs: 4,
  mayis: 4,
  haziran: 5,
  temmuz: 6,
  ağustos: 7,
  agustos: 7,
  eylül: 8,
  eylul: 8,
  ekim: 9,
  kasım: 10,
  kasim: 10,
  aralık: 11,
  aralik: 11
};

interface BiletinoProductData {
  item_id?: string | number;
  item_name?: string;
  item_category?: string;
  item_brand?: string;
}

function biletinoImageUrl(itemId: string): string {
  return `${BILETINO_IMAGE_BASE}/${itemId}/480x270.jpg`;
}

function parseProductData(raw: string): BiletinoProductData | null {
  try {
    const data = JSON.parse(raw) as BiletinoProductData;
    if (!data.item_id || !data.item_name) return null;
    return data;
  } catch {
    return null;
  }
}

function findEventLinkInCard(
  $: cheerio.CheerioAPI,
  el: Element
): string | null {
  const card = $(el).closest('.product, article, li, .event, .event-card, .card');
  const scope = card.length > 0 ? card : $(el).parent();

  let href: string | null = null;
  scope.find('a[href]').each((_, anchor) => {
    if (href) return;
    const candidate = $(anchor).attr('href') || '';
    if (BILETINO_EVENT_PATH.test(candidate)) {
      href = candidate;
    }
  });

  return href;
}

/** "26 Eylül Cumartesi" veya "26 Eylül 2026" gibi kart tarihlerini parse eder. */
function parseBiletinoCardDate(text?: string | null): Date | undefined {
  if (!text?.trim()) return undefined;

  const trimmed = text.trim();
  const withYear = parseTurkishDate(trimmed);
  if (withYear) return withYear;

  const m = trimmed.match(
    /^(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)(?:\s+\S+)*$/i
  );
  if (!m) return undefined;

  const day = parseInt(m[1]!, 10);
  const monthKey = m[2]!
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const month = TR_MONTHS[monthKey];
  if (month === undefined) return undefined;

  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(year, month, day, 20, 0, 0);
  if (candidate.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
    year += 1;
  }
  return new Date(year, month, day, 20, 0, 0);
}

function parseCardDateText($: cheerio.CheerioAPI, el: Element): Date | undefined {
  const card = $(el).closest('.product, article, li, .event, .event-card, .card');
  const scope = card.length > 0 ? card : $(el).parent();

  const dateEl = scope.find('.card-text.date').first();
  if (dateEl.length > 0) {
    const parsed = parseBiletinoCardDate(dateEl.text().trim());
    if (parsed) return parsed;
  }

  const text = scope.text();
  const match = text.match(
    /\d{1,2}\s+(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)(?:\s+\d{4})?(?:\s+\d{1,2}:\d{2})?/i
  );
  return match ? parseBiletinoCardDate(match[0]) : undefined;
}

/** Biletino liste sayfasındaki `productData` script etiketlerinden stub üretir. */
export function extractBiletinoProductStubs(
  html: string,
  baseUrl: string
): EventStub[] {
  const $ = cheerio.load(html);
  const stubs: EventStub[] = [];
  const seen = new Set<string>();

  $('script.productData, script[type="application/json"].productData').each(
    (_, el) => {
      const data = parseProductData($(el).html() || '');
      if (!data?.item_id || !data.item_name) return;

      const itemId = String(data.item_id);
      const href = findEventLinkInCard($, el);
      if (!href) return;

      let externalUrl: string;
      try {
        externalUrl = href.startsWith('http')
          ? href.split('#')[0]!
          : new URL(href, baseUrl).href.split('#')[0]!;
      } catch {
        return;
      }

      if (!BILETINO_EVENT_PATH.test(new URL(externalUrl).pathname)) return;
      if (seen.has(externalUrl)) return;
      seen.add(externalUrl);

      stubs.push({
        platform: 'BILETINO',
        externalId: itemId,
        externalUrl,
        title: data.item_name.trim(),
        coverImage: biletinoImageUrl(itemId),
        startDate: parseCardDateText($, el)
      });
    }
  );

  return stubs;
}

/** @deprecated Use extractBiletinoProductStubs */
export const extractBiletinoListingStubs = extractBiletinoProductStubs;
