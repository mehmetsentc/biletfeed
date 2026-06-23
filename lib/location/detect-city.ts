import { resolveCitySlug } from '@/lib/scraper/normalize';
import {
  DEFAULT_CITY_SLUG,
  getCityBySlug,
  SUPPORTED_CITIES,
  type CitySlug
} from './cities';

const CITY_COORDS: Record<CitySlug, { lat: number; lon: number }> = {
  istanbul: { lat: 41.0082, lon: 28.9784 },
  ankara: { lat: 39.9334, lon: 32.8597 },
  izmir: { lat: 38.4192, lon: 27.1287 },
  antalya: { lat: 36.8969, lon: 30.7133 },
  bursa: { lat: 40.1885, lon: 29.061 },
  eskisehir: { lat: 39.7767, lon: 30.5206 },
  adana: { lat: 37.0, lon: 35.3213 },
  gaziantep: { lat: 37.0662, lon: 37.3833 },
  kayseri: { lat: 38.7312, lon: 35.4787 },
  konya: { lat: 37.8746, lon: 32.4932 },
  mersin: { lat: 36.8121, lon: 34.6415 },
  trabzon: { lat: 41.0027, lon: 39.7168 },
  samsun: { lat: 41.2867, lon: 36.33 },
  bodrum: { lat: 37.0344, lon: 27.4305 },
  mugla: { lat: 37.2153, lon: 28.3636 },
  alanya: { lat: 36.5448, lon: 31.9958 }
};

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestSupportedCity(lat: number, lon: number): CitySlug {
  let best: CitySlug = DEFAULT_CITY_SLUG;
  let bestDist = Infinity;

  for (const [slug, coords] of Object.entries(CITY_COORDS) as [
    CitySlug,
    { lat: number; lon: number }
  ][]) {
    const dist = haversineKm(lat, lon, coords.lat, coords.lon);
    if (dist < bestDist) {
      bestDist = dist;
      best = slug;
    }
  }

  return best;
}

async function reverseGeocodeCity(
  lat: number,
  lon: number
): Promise<{ slug: string; name: string } | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('format', 'json');
    url.searchParams.set('accept-language', 'tr');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'BiletFeed/1.0 (city detection)' }
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      address?: {
        city?: string;
        town?: string;
        state?: string;
        province?: string;
      };
    };

    const raw =
      data.address?.city ??
      data.address?.town ??
      data.address?.province ??
      data.address?.state;

    if (!raw) return null;

    const { slug, name } = resolveCitySlug(raw);
    if (!SUPPORTED_CITIES.some((c) => c.slug === slug)) return null;
    return { slug, name };
  } catch {
    return null;
  }
}

export type DetectedCity = { slug: string; name: string; source: 'geocode' | 'nearest' };

export function getNearbyCitySlugs(
  citySlug: string,
  limit = 4
): string[] {
  const origin = CITY_COORDS[citySlug as CitySlug];
  if (!origin) return [citySlug];

  const ranked = SUPPORTED_CITIES.map((city) => ({
    slug: city.slug,
    dist: haversineKm(
      origin.lat,
      origin.lon,
      CITY_COORDS[city.slug].lat,
      CITY_COORDS[city.slug].lon
    )
  }))
    .sort((a, b) => a.dist - b.dist)
    .map((city) => city.slug);

  return ranked.slice(0, limit);
}

export function detectCityFromGeolocation(): Promise<DetectedCity | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const geocoded = await reverseGeocodeCity(latitude, longitude);
        if (geocoded) {
          resolve({ ...geocoded, source: 'geocode' });
          return;
        }

        const slug = nearestSupportedCity(latitude, longitude);
        resolve({
          slug,
          name: getCityBySlug(slug).name,
          source: 'nearest'
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300_000 }
    );
  });
}
