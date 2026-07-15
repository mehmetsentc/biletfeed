'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode
} from 'react';
import { getTranslations, type Locale, type TranslationKeys } from '@/lib/i18n';
import { DEFAULT_LOCALE } from '@/lib/i18n/locale';

type LocaleContextValue = {
  locale: Locale;
  t: TranslationKeys;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: getTranslations(DEFAULT_LOCALE)
});

export function LocaleProvider({
  locale,
  children
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      t: getTranslations(locale)
    }),
    [locale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

export function useTranslations(): TranslationKeys {
  return useContext(LocaleContext).t;
}
