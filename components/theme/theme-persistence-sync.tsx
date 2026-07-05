'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import {
  isThemePreference,
  persistThemePreference,
  readStoredThemePreference
} from '@/lib/cookies/theme-preference';

/**
 * Bootstrap: cookie/localStorage → next-themes once on mount.
 * Persist: next-themes → cookie on user-driven changes only (never setTheme here).
 */
export function ThemePersistenceSync() {
  const { theme, setTheme } = useTheme();
  const didBootstrap = useRef(false);
  const skipPersistOnce = useRef(false);

  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;

    const stored = readStoredThemePreference();
    if (stored) {
      skipPersistOnce.current = true;
      setTheme(stored);
    }
    // Intentionally mount-only — re-running on setTheme identity caused dark↔light loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!theme || !isThemePreference(theme)) return;
    if (skipPersistOnce.current) {
      skipPersistOnce.current = false;
      return;
    }
    persistThemePreference(theme);
  }, [theme]);

  return null;
}
