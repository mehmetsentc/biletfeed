import { cookies } from 'next/headers';
import { DEFAULT_CITY_SLUG, getCityBySlug, SUPPORTED_CITIES } from './cities';

export const CITY_COOKIE_NAME = 'bf_city';
export const CITY_STORAGE_KEY = 'bf_city_v1';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function getPreferredCitySlug(): Promise<string> {
  const cookieStore = await cookies();
  const slug = cookieStore.get(CITY_COOKIE_NAME)?.value;
  if (slug && SUPPORTED_CITIES.some((c) => c.slug === slug)) return slug;
  return DEFAULT_CITY_SLUG;
}

export async function getPreferredCityName(): Promise<string> {
  const slug = await getPreferredCitySlug();
  return getCityBySlug(slug).name;
}

/** Client-side: persist city choice for SSR + subsequent visits */
export function persistCityChoice(slug: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CITY_STORAGE_KEY, slug);
  document.cookie = `${CITY_COOKIE_NAME}=${encodeURIComponent(slug)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
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
