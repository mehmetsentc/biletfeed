import { cookies, headers } from 'next/headers';
import { de } from './de';
import { en } from './en';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isAppLocale,
  resolveLocaleFromAcceptLanguage,
  type AppLocale
} from './locale';
import { ru } from './ru';
import { tr, type TranslationKeys } from './tr';

const translations: Record<AppLocale, TranslationKeys> = {
  tr,
  en,
  de,
  ru
};

export type Locale = AppLocale;

export function getTranslations(locale: AppLocale = DEFAULT_LOCALE): TranslationKeys {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}

/** Cihaz Accept-Language (+ middleware x-bf-locale) — seçici yok */
export async function getServerLocale(): Promise<AppLocale> {
  const h = await headers();
  const fromMiddleware = h.get('x-bf-locale');
  if (isAppLocale(fromMiddleware)) return fromMiddleware;

  const fromAccept = resolveLocaleFromAcceptLanguage(h.get('accept-language'));
  if (fromAccept) return fromAccept;

  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE)?.value;
  return isAppLocale(raw) ? raw : DEFAULT_LOCALE;
}

export async function getServerTranslations(): Promise<{
  locale: AppLocale;
  t: TranslationKeys;
}> {
  const locale = await getServerLocale();
  return { locale, t: getTranslations(locale) };
}

export { tr, en, de, ru };
export type { TranslationKeys };
export {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HTML_LANG,
  SUPPORTED_LOCALES,
  isAppLocale,
  resolveLocaleFromAcceptLanguage,
  resolveLocaleFromNavigatorLanguage,
  type AppLocale
} from './locale';
