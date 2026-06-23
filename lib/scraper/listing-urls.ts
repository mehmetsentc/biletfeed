import { SUPPORTED_CITIES } from '@/lib/location/cities';

/** Biletix path bölgeleri (anasayfa, arama, kategori sayfaları). */
const BILETIX_REGIONS = [
  'TURKIYE',
  'ISTANBUL',
  'ANKARA',
  'IZMIR',
  'ANTALYA',
  'DIGER'
] as const;

const BILETIX_CATEGORIES = ['MUSIC', 'ART', 'SPORT', 'FAMILY', 'OTHER'] as const;

export function biletixListingUrls(): string[] {
  const base = 'https://www.biletix.com';
  const urls: string[] = [`${base}/football/TURKIYE/tr`];

  for (const region of BILETIX_REGIONS) {
    urls.push(`${base}/anasayfa/${region}/tr`);
    urls.push(`${base}/search/${region}/tr`);

    for (const cat of BILETIX_CATEGORIES) {
      urls.push(`${base}/category/${cat}/${region}/tr`);
    }
  }

  return urls;
}

/**
 * Bubilet yalnızca 6 şehri destekliyor (bubilet.com.tr/sehir-sec doğrular).
 * Her şehrin ana sayfası + tüm kategori/etiket sayfaları taranır.
 */
const BUBILET_CITIES = [
  'istanbul',
  'ankara',
  'izmir',
  'antalya',
  'bursa',
  'eskisehir'
] as const;

const BUBILET_CATEGORIES = [
  'konser',
  'tiyatro',
  'festival',
  'stand-up',
  'elektronik-muzik',
  'cocuk-aktiviteleri',
  'workshop',
  'spor',
] as const;

export function bubiletListingUrls(): string[] {
  const base = 'https://www.bubilet.com.tr';
  const urls: string[] = [base + '/']; // anasayfa — tüm şehirlerin öne çıkanları

  for (const city of BUBILET_CITIES) {
    // Şehir ana sayfası (tüm etkinlikler)
    urls.push(`${base}/${city}`);

    // Her kategori / etiket sayfası
    for (const cat of BUBILET_CATEGORIES) {
      urls.push(`${base}/${city}/etiket/${cat}`);
    }
  }

  return urls;
}

export function biletimoListingUrls(): string[] {
  const urls = [
    'https://www.biletimo.com/',
    'https://www.biletimo.com/etkinlikler',
    'https://www.biletimo.com/konserler',
    'https://www.biletimo.com/tiyatro'
  ];
  for (const city of SUPPORTED_CITIES) {
    urls.push(`https://www.biletimo.com/${city.slug}-etkinlikleri`);
  }
  return urls;
}

export function passoListingUrls(): string[] {
  const urls = [
    'https://passo.com.tr/',
    'https://passo.com.tr/etkinlikler',
    'https://passo.com.tr/konserler',
    'https://passo.com.tr/tiyatro-dansopera',
    'https://passo.com.tr/spor',
    'https://passo.com.tr/festivaller'
  ];
  for (const city of SUPPORTED_CITIES) {
    urls.push(`https://passo.com.tr/${city.slug}`);
    urls.push(`https://passo.com.tr/${city.slug}-etkinlikleri`);
  }
  return urls;
}

export function biletinoListingUrls(): string[] {
  const base = 'https://biletino.com';
  const urls = [`${base}/tr/turkiye/`];

  for (const city of SUPPORTED_CITIES) {
    urls.push(`${base}/tr/city/${city.slug}/`);
  }

  for (let start = 0; start < 150; start += 50) {
    urls.push(
      `${base}/tr/search/?query=&date=future&start=${start}&count=50&ajax=true`
    );
  }

  return urls;
}
