export const SUPPORTED_CITIES = [
  // Büyükşehirler
  { slug: 'istanbul', name: 'İstanbul' },
  { slug: 'ankara', name: 'Ankara' },
  { slug: 'izmir', name: 'İzmir' },
  { slug: 'antalya', name: 'Antalya' },
  { slug: 'bursa', name: 'Bursa' },
  { slug: 'eskisehir', name: 'Eskişehir' },
  // Diğer büyük ve turistik şehirler
  { slug: 'adana', name: 'Adana' },
  { slug: 'gaziantep', name: 'Gaziantep' },
  { slug: 'kayseri', name: 'Kayseri' },
  { slug: 'konya', name: 'Konya' },
  { slug: 'mersin', name: 'Mersin' },
  { slug: 'trabzon', name: 'Trabzon' },
  { slug: 'samsun', name: 'Samsun' },
  { slug: 'mugla', name: 'Muğla' },
  { slug: 'denizli', name: 'Denizli' },
  { slug: 'kocaeli', name: 'Kocaeli' },
  { slug: 'hatay', name: 'Hatay' },
  { slug: 'diyarbakir', name: 'Diyarbakır' },
  { slug: 'manisa', name: 'Manisa' },
  { slug: 'tekirdag', name: 'Tekirdağ' },
  { slug: 'sakarya', name: 'Sakarya' },
  { slug: 'malatya', name: 'Malatya' },
  { slug: 'balikesir', name: 'Balıkesir' },
  { slug: 'canakkale', name: 'Çanakkale' },
  { slug: 'kahramanmaras', name: 'Kahramanmaraş' },
  { slug: 'aydin', name: 'Aydın' },
  { slug: 'sanliurfa', name: 'Şanlıurfa' },
  { slug: 'van', name: 'Van' },
  { slug: 'nevsehir', name: 'Nevşehir' },
  { slug: 'isparta', name: 'Isparta' },
  { slug: 'afyon', name: 'Afyon' },
  { slug: 'edirne', name: 'Edirne' },
  { slug: 'erzurum', name: 'Erzurum' },
  { slug: 'yalova', name: 'Yalova' },
  { slug: 'bolu', name: 'Bolu' },
  { slug: 'mardin', name: 'Mardin' }
] as const;

export type CitySlug = (typeof SUPPORTED_CITIES)[number]['slug'];

export const DEFAULT_CITY_SLUG: CitySlug = 'istanbul';

/** Desteklenen şehir — bilinmeyen slug için undefined döner (sessiz İstanbul fallback yok) */
export function getCityBySlug(slug: string) {
  return SUPPORTED_CITIES.find((c) => c.slug === slug);
}

export function getCityName(slug: string): string {
  return getCityBySlug(slug)?.name ?? slug;
}

export function getCityNameOrDefault(slug: string): string {
  return getCityBySlug(slug)?.name ?? getCityBySlug(DEFAULT_CITY_SLUG)!.name;
}

export function isSupportedCitySlug(slug: string): slug is CitySlug {
  return SUPPORTED_CITIES.some((city) => city.slug === slug);
}

/** Şehir seçici — Türkçe alfabetik sıra */
export function sortCitiesForPicker<T extends { name: string }>(cities: T[]): T[] {
  return [...cities].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}
