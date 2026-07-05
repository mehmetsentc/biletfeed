import {
  DEFAULT_THEME_PREFERENCE,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY
} from '@/lib/cookies/theme-preference.constants';

/** Blocking script — applies theme class before first paint (cookie > localStorage > system). */
export function ThemeInitScript() {
  const script = `
(function() {
  try {
    var cookieKey = ${JSON.stringify(THEME_COOKIE_NAME)};
    var storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    var cookieMatch = document.cookie.match(new RegExp('(?:^|; )' + cookieKey + '=([^;]*)'));
    var stored = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
    if (!stored) {
      try { stored = localStorage.getItem(storageKey); } catch (e) {}
    }
    var theme = stored === 'light' || stored === 'dark' || stored === 'system'
      ? stored
      : ${JSON.stringify(DEFAULT_THEME_PREFERENCE)};
    var resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.colorScheme = resolved;
  } catch (e) {}
})();
`.trim();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
