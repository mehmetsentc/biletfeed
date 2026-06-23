import { SUPPORTED_CITIES } from './cities';
import {
  CITY_COOKIE_NAME,
  CITY_STORAGE_KEY
} from './city-preference.constants';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Client-side: persist city choice for SSR + subsequent visits */
export function persistCityChoice(slug: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CITY_STORAGE_KEY, slug);
  const secure =
    window.location.protocol === 'https:' ? ';Secure' : '';
  document.cookie = `${CITY_COOKIE_NAME}=${encodeURIComponent(slug)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax${secure}`;
}

export function readStoredCitySlug(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CITY_STORAGE_KEY);
  if (stored && SUPPORTED_CITIES.some((c) => c.slug === stored)) return stored;
  return null;
}

export function hasStoredCityChoice(): boolean {
  return readStoredCitySlug() !== null;
}

export { CITY_COOKIE_NAME, CITY_STORAGE_KEY } from './city-preference.constants';
