'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  isThemePreference,
  persistThemePreference,
  readStoredThemePreference
} from '@/lib/cookies/theme-preference';

/** Keeps cookie + localStorage aligned with next-themes (cookie is source of truth on load). */
export function ThemePersistenceSync() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const stored = readStoredThemePreference();
    if (stored) {
      setTheme(stored);
    }
  }, [setTheme]);

  useEffect(() => {
    if (!theme || !isThemePreference(theme)) return;
    persistThemePreference(theme);
  }, [theme]);

  return null;
}
