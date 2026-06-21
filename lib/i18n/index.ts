import { tr, type TranslationKeys } from './tr';

const translations = { tr } as const;

export type Locale = keyof typeof translations;

export function getTranslations(locale: Locale = 'tr'): TranslationKeys {
  return translations[locale];
}

export { tr };
