/**
 * Server-only i18n helpers — only import from Server Components / Route Handlers.
 * Client components must use useTranslations() from @/components/providers instead.
 */
import { cookies, headers } from 'next/headers';
import { getTranslations } from './index';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isAppLocale,
  resolveLocaleFromAcceptLanguage,
  type AppLocale
} from './locale';
import type { TranslationKeys } from './tr';

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
