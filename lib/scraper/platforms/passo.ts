/**
 * Passo API Scraper
 *
 * Passo tamamen Angular SPA olduğu için HTML scraping çalışmıyor.
 * Bu adapter doğrudan Passo'nun internal REST API'sini kullanır:
 *   https://ticketingweb.passo.com.tr/api/passoweb/
 *
 * API keşfi: Chrome DevTools network tab ile tespit edildi.
 */

import { resolveCitySlug, mapCategory } from '@/lib/scraper/normalize';
import type { ScrapedEventRaw, ScraperResult } from '@/lib/scraper/types';

const TICKETING_API = 'https://ticketingweb.passo.com.tr/api/passoweb';
const IMAGE_BASE_SLIDER = 'https://image.passo.com.tr/api/r/tr/p/webSlider/';
const IMAGE_BASE_EVENT = 'https://image.passo.com.tr/api/r/tr/p/event/';

const FETCH_HEADERS = {
  'Accept': 'application/json',
  'Origin': 'https://www.passo.com.tr',
  'Referer': 'https://www.passo.com.tr/tr',
  'User-Agent': 'Mozilla/5.0 (compatible; BiletFeedBot/1.0)'
};

// ─── Passo API tipleri ────────────────────────────────────────────────────────

interface PassoSliderItem {
  id: number;
  sliderImage: string;    // "filename.jpg?w=720&h=420"
  sliderTitle: string;
  freeTexts: string;      // "Venue | Date" veya "City | City ..."
  startDate: string;      // ISO
  endDate: string;        // ISO
  link: string;           // tam Passo URL
  genres: Array<{ id: number; name: string }>;
}

interface PassoSliderResponse {
  totalItemCount: number;
  valueList: PassoSliderItem[];
  isError: boolean;
}

interface PassoAllEventsItem {
  id: number;
  name: string;
  image?: string;
  startDate: string;
  endDate?: string;
  venue?: string;
  cityName?: string;
  locationId?: number;
  genreId?: number;
  link?: string;
  url?: string;
  seoUrl?: string;
  eventGroupId?: number;
}

interface PassoAllEventsResponse {
  totalItemCount: number;
  valueList?: PassoAllEventsItem[];
  events?: PassoAllEventsItem[];
  isError: boolean;
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

/** location ID → şehir slug eşlemesi (getalleventlocation'dan) */
const LOCATION_ID_TO_CITY: Record<number, string> = {
  100: 'adana',
  109: 'ankara',
  110: 'antalya',
  112: 'aydin',
  113: 'balikesir',
  119: 'bursa',
  123: 'denizli',
  124: 'diyarbakir',
  125: 'edirne',
  129: 'eskisehir',
  130: 'gaziantep',
  131: 'giresun',
  134: 'hatay',
  135: 'isparta',
  101: 'istanbul',
  137: 'izmir',
  140: 'kayseri',
  143: 'kocaeli',
  144: 'konya',
  149: 'mardin',
  136: 'mersin',
  150: 'mugla',
  152: 'nevsehir',
  156: 'sakarya',
  157: 'samsun',
  164: 'sanliurfa',
  159: 'sinop',
  160: 'sivas',
  103: 'trabzon',
  178: 'yalova',
};

/** Genre ID → kategori slug */
const GENRE_ID_TO_SLUG: Record<number, string> = {
  4615: 'spor',
  8615: 'muzik',
  11615: 'tiyatro',
  13615: 'spor',
  15615: 'sanat',
  12615: 'diger',
};

/** İstanbul'daki bilinen mekan anahtar kelimeleri */
const ISTANBUL_VENUE_KEYWORDS = [
  'beşiktaş', 'zorlu', 'harbiye', 'küçükçiftlik', 'ataköy', 'parkorman',
  'babylon', 'volkswagen arena', 'salon iksv', 'haydar', 'bostancı',
  'istanbul kongre', 'lutfi kirdar', 'life park istanbul', 'rams park',
  'ülker stadium', 'türk telekom', 'papp laszlo', 'cemil topuzlu',
  'açıkhava', 'acikhava', 'marina arena',
];

/** Türkçe şehir → slug */
const TR_CITY_TO_SLUG: Record<string, string> = {
  'istanbul': 'istanbul', 'İstanbul': 'istanbul',
  'ankara': 'ankara', 'Ankara': 'ankara',
  'izmir': 'izmir', 'İzmir': 'izmir',
  'antalya': 'antalya', 'Antalya': 'antalya',
  'bursa': 'bursa', 'Bursa': 'bursa',
  'eskişehir': 'eskisehir', 'Eskişehir': 'eskisehir',
  'adana': 'adana', 'Adana': 'adana',
  'gaziantep': 'gaziantep', 'Gaziantep': 'gaziantep',
  'kayseri': 'kayseri', 'Kayseri': 'kayseri',
  'konya': 'konya', 'Konya': 'konya',
  'mersin': 'mersin', 'Mersin': 'mersin',
  'trabzon': 'trabzon', 'Trabzon': 'trabzon',
  'samsun': 'samsun', 'Samsun': 'samsun',
  'bodrum': 'bodrum', 'Bodrum': 'bodrum',
  'muğla': 'mugla', 'Muğla': 'mugla',
  'alanya': 'alanya', 'Alanya': 'alanya',
  'diyarbakır': 'diyarbakir', 'Diyarbakır': 'diyarbakir',
  'denizli': 'denizli', 'Denizli': 'denizli',
  'kocaeli': 'kocaeli', 'Kocaeli': 'kocaeli',
  'sakarya': 'sakarya', 'Sakarya': 'sakarya',
};

/**
 * freeTexts ve mekan adından şehir slug'ını tahmin et.
 * "Beşiktaş Tüpraş Stadyumu | 28 Haz 2026" → "istanbul"
 * "İstanbul | İzmir | Bursa" → "istanbul" (ilk şehir)
 */
function detectCityFromText(
  freeTexts: string,
  locationId?: number
): { slug: string; name: string } {
  // locationId varsa doğrudan kullan
  if (locationId && LOCATION_ID_TO_CITY[locationId]) {
    return resolveCitySlug(LOCATION_ID_TO_CITY[locationId]);
  }

  const lower = freeTexts.toLowerCase();

  // Bilinen İstanbul mekan anahtar kelimeleri
  for (const keyword of ISTANBUL_VENUE_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      return { slug: 'istanbul', name: 'İstanbul' };
    }
  }

  // Türkçe şehir adı araması
  for (const [tr, slug] of Object.entries(TR_CITY_TO_SLUG)) {
    if (lower.includes(tr.toLowerCase())) {
      return resolveCitySlug(slug);
    }
  }

  // Varsayılan: İstanbul
  return { slug: 'istanbul', name: 'İstanbul' };
}

/** Passo etkinlik URL'sinden externalId çıkar */
function extractPassoId(link: string): string {
  try {
    const parts = new URL(link).pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? link.slice(-20);
  } catch {
    return link.slice(-20);
  }
}

/** Slider image adını tam URL'e dönüştür */
function buildSliderImageUrl(sliderImage: string): string {
  // "filename.jpg?w=720&h=420" → tam URL
  const filename = sliderImage.split('?')[0] ?? sliderImage;
  return `${IMAGE_BASE_SLIDER}${filename}`;
}

/** Event image adını tam URL'e dönüştür */
function buildEventImageUrl(image: string): string {
  if (image.startsWith('http')) return image;
  const filename = image.split('?')[0] ?? image;
  return `${IMAGE_BASE_EVENT}${filename}`;
}

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const resp = await fetch(`${TICKETING_API}${path}`, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) return null;
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const resp = await fetch(`${TICKETING_API}${path}`, {
      method: 'POST',
      headers: { ...FETCH_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    if (!resp.ok) return null;
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}

// ─── Slider → ScrapedEventRaw dönüşümü ──────────────────────────────────────

function mapSliderToEvent(item: PassoSliderItem): ScrapedEventRaw | null {
  const title = item.sliderTitle?.trim();
  if (!title) return null;

  // Sadece gerçek etkinlik URL'leri (hediyekart, iade vb. atla)
  const link = item.link ?? '';
  if (!link.includes('/tr/etkinlik') && !link.includes('/tr/kombine')) return null;
  if (link.includes('/hediyekart') || link.includes('/iade-guvencesi') ||
      link.includes('/kampanya') || link.includes('/nft')) return null;

  const startDate = item.startDate ? new Date(item.startDate) : null;
  const endDate = item.endDate ? new Date(item.endDate) : null;

  if (!startDate || isNaN(startDate.getTime())) return null;

  // Geçmiş etkinlikleri atla
  const now = new Date();
  const effectiveEnd = endDate && !isNaN(endDate.getTime()) ? endDate : startDate;
  if (effectiveEnd < now) return null;

  const city = detectCityFromText(item.freeTexts ?? '');
  const genreNames = (item.genres ?? []).map((g) => g.name).join(' ');
  const { categorySlug, eventType } = mapCategory(title, genreNames, [genreNames]);

  const externalId = extractPassoId(link);
  const coverImage = item.sliderImage ? buildSliderImageUrl(item.sliderImage) : '';

  // freeTexts'i description olarak kullan
  const description = item.freeTexts?.trim() ?? title;

  return {
    platform: 'PASSO',
    externalId: `passo-${externalId}`,
    externalUrl: link,
    title,
    description,
    shortDescription: description.slice(0, 160),
    coverImage,
    citySlug: city.slug,
    cityName: city.name,
    venue: item.freeTexts?.split('|')[0]?.trim() ?? undefined,
    categorySlug,
    eventType,
    startDate,
    endDate: endDate && !isNaN(endDate.getTime()) ? endDate : startDate,
    price: 0,
    isFree: false,
    tags: item.genres?.map((g) => g.name.toLowerCase()) ?? [],
  };
}

// ─── allevents POST → ScrapedEventRaw ───────────────────────────────────────

function mapAllEventItem(item: PassoAllEventsItem): ScrapedEventRaw | null {
  const title = item.name?.trim();
  if (!title) return null;

  const startDate = item.startDate ? new Date(item.startDate) : null;
  if (!startDate || isNaN(startDate.getTime())) return null;

  const now = new Date();
  if (startDate < now) return null;

  const citySlug = item.locationId && LOCATION_ID_TO_CITY[item.locationId]
    ? LOCATION_ID_TO_CITY[item.locationId]!
    : item.cityName
      ? detectCityFromText(item.cityName).slug
      : 'istanbul';

  const city = resolveCitySlug(citySlug);

  const genreSlug = item.genreId ? (GENRE_ID_TO_SLUG[item.genreId] ?? 'muzik') : 'muzik';
  const { categorySlug, eventType } = mapCategory(title, genreSlug);

  // URL oluştur
  const link = item.link ?? item.url ??
    (item.seoUrl
      ? `https://www.passo.com.tr/tr/etkinlik/${item.seoUrl}/${item.id}`
      : `https://www.passo.com.tr/tr/etkinlik/${item.id}`);

  const externalId = `passo-${item.id}`;
  const coverImage = item.image ? buildEventImageUrl(item.image) : '';

  const endDate = item.endDate ? new Date(item.endDate) : startDate;

  return {
    platform: 'PASSO',
    externalId,
    externalUrl: link,
    title,
    description: item.venue ?? title,
    coverImage,
    citySlug: city.slug,
    cityName: city.name,
    venue: item.venue,
    categorySlug,
    eventType,
    startDate,
    endDate,
    price: 0,
    isFree: false,
    tags: [genreSlug],
  };
}

// ─── Ana scraper ──────────────────────────────────────────────────────────────

export async function scrapePasso(): Promise<ScraperResult> {
  const errors: string[] = [];
  const eventMap = new Map<string, ScrapedEventRaw>();

  // 1. Slider etkinlikleri (en güvenilir kaynak — tam veri içeriyor)
  const sliderResp = await apiGet<PassoSliderResponse>('/getwebslidercustomlist/118');
  if (sliderResp?.valueList) {
    let sliderCount = 0;
    for (const item of sliderResp.valueList) {
      const ev = mapSliderToEvent(item);
      if (ev && !eventMap.has(ev.externalUrl)) {
        eventMap.set(ev.externalUrl, ev);
        sliderCount++;
      }
    }
    errors.push(`PASSO: slider → ${sliderCount} etkinlik`);
  } else {
    errors.push('PASSO: slider API yanıt vermedi');
  }

  // 2. allevents POST (tüm etkinlikler — sayfalı)
  // Body formatı: boş veya { pageIndex, pageSize }
  const allEventsResp = await apiPost<PassoAllEventsResponse>('/allevents', {});
  const allItems = allEventsResp?.valueList ?? allEventsResp?.events ?? [];
  if (allItems.length > 0) {
    let allCount = 0;
    for (const item of allItems) {
      const ev = mapAllEventItem(item);
      if (ev && !eventMap.has(ev.externalUrl)) {
        eventMap.set(ev.externalUrl, ev);
        allCount++;
      }
    }
    errors.push(`PASSO: allevents → ${allCount} yeni etkinlik`);
  } else {
    // allevents çalışmazsa hata değil, sadece log
    errors.push('PASSO: allevents POST veri döndürmedi (slider yeterli)');
  }

  const events = [...eventMap.values()];

  errors.push(`PASSO: toplam ${events.length} etkinlik`);

  return { platform: 'PASSO', events, errors };
}
