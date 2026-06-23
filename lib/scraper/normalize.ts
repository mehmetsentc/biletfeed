import type { EventType } from '@prisma/client';
import { mergeDateWithTimeText, parseScraperDateTime } from '@/lib/scraper/dates';

const CITY_ALIASES: Record<string, string> = {
  istanbul: 'istanbul',
  İstanbul: 'istanbul',
  ankara: 'ankara',
  Ankara: 'ankara',
  izmir: 'izmir',
  İzmir: 'izmir',
  antalya: 'antalya',
  Antalya: 'antalya',
  bursa: 'bursa',
  Bursa: 'bursa',
  eskisehir: 'eskisehir',
  eskişehir: 'eskisehir',
  Eskişehir: 'eskisehir',
  adana: 'adana',
  gaziantep: 'gaziantep',
  konya: 'konya',
  mersin: 'mersin',
  kayseri: 'kayseri',
  online: 'online'
};

export function resolveCitySlug(input?: string | null): {
  slug: string;
  name: string;
} {
  if (!input?.trim()) {
    return { slug: 'istanbul', name: 'İstanbul' };
  }

  const key = input.trim().toLowerCase().replace(/ı/g, 'i');
  const slug =
    CITY_ALIASES[input.trim()] ||
    CITY_ALIASES[key] ||
    key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

  const name = input.trim();
  return { slug, name };
}

const CATEGORY_KEYWORDS: Array<{ slug: string; type: EventType; patterns: RegExp[] }> =
  [
    {
      slug: 'spor',
      type: 'sports',
      patterns: [
        /\bspor\b/i,
        /futbol/i,
        /football/i,
        /basketbol/i,
        /basketball/i,
        /\bfiba\b/i,
        /\bnba\b/i,
        /\buel\b/i,
        /şampiyonlar ligi/i,
        /maç\b/i,
        /voleybol/i,
        /tenis\b/i,
        /formula\s*1/i,
        /\bf1\b/i,
        /motogp/i,
        /güreş/i,
        /boks\b/i,
        /derbi/i,
        /galatasaray|fenerbahçe|beşiktaş|trabzonspor|başakşehir/i
      ]
    },
    {
      slug: 'muzik',
      type: 'concert',
      patterns: [/konser/i, /müzik/i, /\bdj\b/i, /\brock\b/i, /\bpop\b/i]
    },
    {
      slug: 'festival',
      type: 'festival',
      patterns: [/festival/i, /fuar/i]
    },
    {
      slug: 'tiyatro',
      type: 'theatre',
      patterns: [/tiyatro/i, /stand.?up/i, /müzikal/i, /\bopera\b/i, /\bbale\b/i]
    },
    {
      slug: 'komedi',
      type: 'theatre',
      patterns: [/komedi/i, /comedy/i]
    },
    {
      slug: 'cocuk',
      type: 'other',
      patterns: [/çocuk/i, /\bcocuk\b/i, /\bkids\b/i, /\baile\b/i, /family/i]
    },
    {
      slug: 'teknoloji',
      type: 'workshop',
      patterns: [/atölye/i, /eğitim/i, /seminer/i, /konferans/i, /workshop/i]
    },
    {
      slug: 'online',
      type: 'online',
      patterns: [/online/i, /canlı yayın/i, /webinar/i]
    },
    {
      slug: 'sanat',
      type: 'other',
      patterns: [/sergi/i, /\bsanat\b/i]
    }
  ];

function matchCategoryInText(
  text: string
): { categorySlug: string; eventType: EventType } | null {
  const normalized = text.trim();
  if (!normalized) return null;

  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.patterns.some((p) => p.test(normalized))) {
      return { categorySlug: rule.slug, eventType: rule.type };
    }
  }

  return null;
}

export function mapCategory(
  title: string,
  description: string,
  hints?: string[]
): { categorySlug: string; eventType: EventType } {
  // Başlık her zaman öncelikli — platform ipuçları (ör. "tiyatro" genre slug) spor etkinliğini ezmesin
  const fromTitle = matchCategoryInText(title);
  if (fromTitle) return fromTitle;

  const fromDescription = matchCategoryInText(description);
  if (fromDescription) return fromDescription;

  for (const hint of hints || []) {
    const fromHint = matchCategoryInText(hint);
    if (fromHint) return fromHint;
  }

  return { categorySlug: 'muzik', eventType: 'concert' };
}

export function categorySlugToEventType(slug: string): EventType {
  return (
    CATEGORY_KEYWORDS.find((rule) => rule.slug === slug)?.type ?? 'other'
  );
}

export function parsePrice(text?: string | null): {
  price: number;
  isFree: boolean;
} {
  // No price text → fiyat bilinmiyor, ücretsiz değil
  if (!text) return { price: 0, isFree: false };
  const lower = text.toLowerCase();
  // Açıkça "ücretsiz" veya "0 TL" yazıyorsa ücretsiz
  if (/ücretsiz|free|0\s*₺|0\s*tl/i.test(lower)) {
    return { price: 0, isFree: true };
  }
  const match = text.replace(/\./g, '').match(/(\d[\d\s]*)/);
  const price = match ? parseInt(match[1].replace(/\s/g, ''), 10) : 0;
  // Sayı bulunamazsa yine bilinmiyor, ücretsiz değil
  return { price: Number.isFinite(price) && price > 0 ? price : 0, isFree: false };
}

export function parseTurkishDate(text?: string | null): Date | null {
  if (!text) return null;

  const parsed = parseScraperDateTime(text);
  if (parsed) return parsed;

  const timeMatch = text.match(/\b(\d{1,2}):(\d{2})\b/);

  const trMonths: Record<string, number> = {
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

  const m = text
    .toLowerCase()
    .match(/(\d{1,2})[\s./-]+([a-zçğıöşü]+)(?:[\s./-]+(\d{4}))?/i);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = trMonths[m[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '')];
    const year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
    if (month !== undefined) {
      const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const baseDate = parseScraperDateTime(isoDate, 20);
      if (!baseDate) return null;
      if (timeMatch) {
        return mergeDateWithTimeText(baseDate, timeMatch[0]) || baseDate;
      }
      return baseDate;
    }
  }

  return null;
}

export function extractNextData<T = unknown>(html: string): T | null {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}

export async function fetchHtml(
  url: string,
  timeoutMs = 20000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        Referer: new URL(url).origin + '/'
      },
      next: { revalidate: 0 }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}
