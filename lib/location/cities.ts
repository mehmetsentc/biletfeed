export const SUPPORTED_CITIES = [
  { slug: 'istanbul', name: 'İstanbul' },
  { slug: 'ankara', name: 'Ankara' },
  { slug: 'izmir', name: 'İzmir' },
  { slug: 'antalya', name: 'Antalya' },
  { slug: 'bursa', name: 'Bursa' },
  { slug: 'eskisehir', name: 'Eskişehir' }
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
