export const SUPPORTED_CITIES = [
  { slug: 'istanbul', name: 'İstanbul' },
  { slug: 'ankara', name: 'Ankara' },
  { slug: 'izmir', name: 'İzmir' },
  { slug: 'antalya', name: 'Antalya' },
  { slug: 'bursa', name: 'Bursa' },
  { slug: 'eskisehir', name: 'Eskişehir' },
  { slug: 'adana', name: 'Adana' },
  { slug: 'gaziantep', name: 'Gaziantep' },
  { slug: 'kayseri', name: 'Kayseri' },
  { slug: 'konya', name: 'Konya' },
  { slug: 'mersin', name: 'Mersin' },
  { slug: 'trabzon', name: 'Trabzon' },
  { slug: 'samsun', name: 'Samsun' },
  { slug: 'bodrum', name: 'Bodrum' },
  { slug: 'mugla', name: 'Muğla' },
  { slug: 'alanya', name: 'Alanya' }
] as const;

export type CitySlug = (typeof SUPPORTED_CITIES)[number]['slug'];

export const DEFAULT_CITY_SLUG: CitySlug = 'istanbul';

export function getCityBySlug(slug: string) {
  return (
    SUPPORTED_CITIES.find((c) => c.slug === slug) ??
    SUPPORTED_CITIES.find((c) => c.slug === DEFAULT_CITY_SLUG)!
  );
}

export function getCityName(slug: string): string {
  return getCityBySlug(slug).name;
}
