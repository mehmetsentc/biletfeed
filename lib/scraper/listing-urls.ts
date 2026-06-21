import { SUPPORTED_CITIES } from '@/lib/location/cities';

/** Biletix search path segment (uppercase ASCII) */
const BILETIX_CITY: Record<string, string> = {
  istanbul: 'ISTANBUL',
  ankara: 'ANKARA',
  izmir: 'IZMIR',
  antalya: 'ANTALYA',
  bursa: 'BURSA',
  eskisehir: 'ESKISEHIR'
};

const BILETIX_CATEGORIES = ['MUSIC', 'ART', 'SPORT', 'FAMILY', 'OTHER'];

export function biletixListingUrls(): string[] {
  const urls = ['https://www.biletix.com/search/TURKIYE/tr'];

  for (const city of SUPPORTED_CITIES) {
    const segment = BILETIX_CITY[city.slug];
    if (!segment) continue;
    urls.push(`https://www.biletix.com/search/${segment}/tr`);
    for (const cat of BILETIX_CATEGORIES) {
      urls.push(`https://www.biletix.com/category/${cat}/${segment}/tr`);
    }
  }

  return urls;
}

export function bubiletListingUrls(): string[] {
  const urls = ['https://www.bubilet.com.tr/'];
  for (const city of SUPPORTED_CITIES) {
    urls.push(`https://www.bubilet.com.tr/${city.slug}`);
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
