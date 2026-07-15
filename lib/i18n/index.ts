import { de } from './de';
import { en } from './en';
import { DEFAULT_LOCALE, type AppLocale } from './locale';
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
