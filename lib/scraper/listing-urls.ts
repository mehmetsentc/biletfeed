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
 * Bubilet Türkiye'nin tüm 81 ilini destekliyor (bubilet.com.tr şehir seçici).
 * Her il için tüm kategori/etiket sayfaları taranır.
 * Sıralama: önce yüksek etkinlik olasılığı olan şehirler (daha verimli scraping için).
 * NOT: Afyon için Bubilet slug'ı "afyonkarahisar" — "afyon" değil.
 */
const BUBILET_CITIES = [
  // Tier 1 — çok yüksek etkinlik trafiği
  'istanbul', 'ankara', 'izmir', 'antalya', 'bursa', 'eskisehir',
  'gaziantep', 'kayseri', 'samsun', 'trabzon', 'kocaeli', 'mersin',
  'konya', 'diyarbakir', 'mugla',
  // Tier 2 — orta düzey etkinlik
  'adana', 'manisa', 'sakarya', 'hatay', 'malatya', 'denizli',
  'edirne', 'canakkale', 'aydin', 'balikesir', 'tekirdag', 'ordu',
  'sivas', 'van', 'erzurum', 'kahramanmaras', 'sanliurfa', 'mardin',
  'nevsehir', 'isparta', 'bolu', 'rize', 'karabuk', 'yalova', 'kilis',
  // Tier 3 — kalan iller
  'adiyaman', 'afyonkarahisar', 'agri', 'aksaray', 'amasya',
  'ardahan', 'artvin', 'bartin', 'batman', 'bayburt',
  'bilecik', 'bingol', 'bitlis', 'burdur',
  'cankiri', 'corum', 'duzce', 'elazig', 'erzincan',
  'giresun', 'gumushane', 'hakkari',
  'igdir', 'karaman', 'kars', 'kastamonu', 'kirikkale',
  'kirklareli', 'kirsehir', 'kutahya',
  'mus', 'nigde', 'osmaniye',
  'siirt', 'sinop', 'sirnak', 'tokat', 'tunceli',
  'usak', 'yozgat', 'zonguldak'
] as const;

/**
 * Bubilet'in desteklediği uluslararası şehirler.
 * Türk diasporası için (Almanya, İngiltere, Fransa, vb.) etkinlikler var.
 * Sadece konser kategorisi taranır — diğer kategorilerde etkinlik çok nadir.
 */
const BUBILET_INTL_CITIES = [
  'kibris',    // KKTC
  'baku',      // Azerbaycan
  'londra',    // İngiltere
  'berlin',    // Almanya
  'stuttgart', // Almanya
  'muenchen',  // Almanya (München)
  'paris',     // Fransa
  'dubai',     // BAE
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

  // Türkiye illeri — tüm kategoriler
  for (const city of BUBILET_CITIES) {
    urls.push(`${base}/${city}`);
    for (const cat of BUBILET_CATEGORIES) {
      urls.push(`${base}/${city}/etiket/${cat}`);
    }
  }

  // Uluslararası şehirler — sadece konser + tiyatro (diğer kategoriler nadir)
  for (const city of BUBILET_INTL_CITIES) {
    urls.push(`${base}/${city}`);
    urls.push(`${base}/${city}/etiket/konser`);
    urls.push(`${base}/${city}/etiket/tiyatro`);
    urls.push(`${base}/${city}/etiket/festival`);
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
