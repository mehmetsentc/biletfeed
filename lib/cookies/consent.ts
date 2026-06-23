export const COOKIE_CONSENT_NAME = 'bf_cookie_consent';
export const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export type CookieConsentChoice = 'necessary' | 'all';

export type CookiePreferences = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

export const defaultPreferences: CookiePreferences = {
  necessary: true,
  functional: true,
  analytics: true,
  marketing: true
};

export const necessaryOnlyPreferences: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false
};

export function preferencesFromChoice(choice: CookieConsentChoice): CookiePreferences {
  return choice === 'all' ? defaultPreferences : necessaryOnlyPreferences;
}

export function readCookieConsent(): CookieConsentChoice | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_CONSENT_NAME}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.split('=')[1] || '');
  return value === 'all' || value === 'necessary' ? value : null;
}

export function readCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('bf_cookie_preferences');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookiePreferences;
    return { ...parsed, necessary: true };
  } catch {
    return null;
  }
}

export function saveCookieConsent(
  choice: CookieConsentChoice,
  preferences?: CookiePreferences
) {
  if (typeof document === 'undefined') return;

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_CONSENT_NAME}=${choice}; path=/; max-age=${COOKIE_CONSENT_MAX_AGE}; SameSite=Lax${secure}`;

  const prefs = preferences ?? preferencesFromChoice(choice);
  localStorage.setItem('bf_cookie_preferences', JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent('bf-cookie-consent-change', { detail: prefs }));
}

export function hasAnalyticsConsent(): boolean {
  const prefs = readCookiePreferences();
  if (prefs) return prefs.analytics;
  const choice = readCookieConsent();
  return choice === 'all';
}
