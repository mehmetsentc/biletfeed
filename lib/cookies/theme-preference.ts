import {
  DEFAULT_THEME_PREFERENCE,
  THEME_COOKIE_NAME,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  type ThemePreference
} from './theme-preference.constants';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isThemePreference(value: string): value is ThemePreference {
  return (THEME_PREFERENCES as string[]).includes(value);
}

/** Client-side: persist theme cookie for SSR init script (localStorage is owned by next-themes). */
export function persistThemePreference(theme: ThemePreference) {
  if (typeof window === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

export function readStoredThemePreference(): ThemePreference | null {
  if (typeof window === 'undefined') return null;

  const cookieMatch = document.cookie.match(
    new RegExp(`(?:^|; )${THEME_COOKIE_NAME}=([^;]*)`)
  );
  const fromCookie = cookieMatch?.[1]
    ? decodeURIComponent(cookieMatch[1])
    : null;
  if (fromCookie && isThemePreference(fromCookie)) return fromCookie;

  const fromStorage = localStorage.getItem(THEME_STORAGE_KEY);
  if (fromStorage && isThemePreference(fromStorage)) return fromStorage;

  return null;
}

export function resolveThemePreference(
  theme: ThemePreference | null | undefined
): 'light' | 'dark' {
  const preference = theme ?? DEFAULT_THEME_PREFERENCE;
  if (preference === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return preference;
}

export { THEME_COOKIE_NAME, THEME_STORAGE_KEY } from './theme-preference.constants';
export type { ThemePreference } from './theme-preference.constants';
