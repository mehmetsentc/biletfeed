import { cookies } from 'next/headers';
import {
  DEFAULT_CITY_SLUG,
  getCityNameOrDefault,
  isSupportedCitySlug
} from './cities';
import { CITY_COOKIE_NAME } from './city-preference.constants';

export async function getPreferredCitySlug(): Promise<string> {
  const cookieStore = await cookies();
  const slug = cookieStore.get(CITY_COOKIE_NAME)?.value;
  if (slug && isSupportedCitySlug(slug)) return slug;
  return DEFAULT_CITY_SLUG;
}

export async function getPreferredCityName(): Promise<string> {
  const slug = await getPreferredCitySlug();
  return getCityNameOrDefault(slug);
}

/** Cookie’de seçili şehir varsa adını döner; yoksa null (varsayılan şehir soft-boost uygulanmaz). */
export async function getSelectedCityNameOrNull(): Promise<string | null> {
  const cookieStore = await cookies();
  const slug = cookieStore.get(CITY_COOKIE_NAME)?.value;
  if (!slug || !isSupportedCitySlug(slug)) return null;
  return getCityNameOrDefault(slug);
}
