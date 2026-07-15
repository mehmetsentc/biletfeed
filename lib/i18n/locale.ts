export const LOCALE_COOKIE = 'bf-locale';

export const SUPPORTED_LOCALES = ['tr', 'en', 'de', 'ru'] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';

export const LOCALE_HTML_LANG: Record<AppLocale, string> = {
  tr: 'tr',
  en: 'en',
  de: 'de',
  ru: 'ru'
};

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return (
    value === 'tr' || value === 'en' || value === 'de' || value === 'ru'
  );
}

/**
 * Cihaz / tarayıcı Accept-Language veya navigator.language → uygulama dili.
 * tr / en / de / ru eşleşir; diğer her şey → en.
 */
export function resolveLocaleFromAcceptLanguage(
  header: string | null | undefined
): AppLocale {
  if (!header?.trim()) return DEFAULT_LOCALE;

  const parts = header.split(',').map((part) => {
    const [tag, ...params] = part.trim().split(';');
    const qParam = params.find((p) => p.trim().startsWith('q='));
    const q = qParam ? Number(qParam.trim().slice(2)) : 1;
    return {
      tag: tag.trim().toLowerCase(),
      q: Number.isFinite(q) ? q : 1
    };
  });

  parts.sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    const primary = tag.split('-')[0];
    if (primary === 'tr') return 'tr';
    if (primary === 'en') return 'en';
    if (primary === 'de') return 'de';
    if (primary === 'ru') return 'ru';
  }

  return DEFAULT_LOCALE;
}

export function resolveLocaleFromNavigatorLanguage(
  language: string | null | undefined
): AppLocale {
  return resolveLocaleFromAcceptLanguage(language ?? undefined);
}
