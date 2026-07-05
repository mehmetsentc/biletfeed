'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { ThemePersistenceSync } from '@/components/theme/theme-persistence-sync';
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_STORAGE_KEY
} from '@/lib/cookies/theme-preference.constants';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME_PREFERENCE}
      enableSystem
      disableTransitionOnChange
      storageKey={THEME_STORAGE_KEY}
      themes={['light', 'dark', 'system']}
    >
      <ThemePersistenceSync />
      {children}
    </NextThemesProvider>
  );
}
