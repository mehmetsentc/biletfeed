import { getCookieDomain } from '@/lib/config/domain';

/** Alt alanlar arası paylaşılan çıkış işareti (httpOnly değil — client okur) */
export const GLOBAL_LOGOUT_COOKIE = 'bf_global_logout';

/** Çıkış sonrası diğer origin'lerin sessiz yeniden girişini engeller */
const GLOBAL_LOGOUT_TTL_MS = 24 * 60 * 60 * 1000;
const GLOBAL_LOGOUT_TTL_SEC = Math.floor(GLOBAL_LOGOUT_TTL_MS / 1000);

function cookieDomainAttr(): string {
  const domain = getCookieDomain();
  return domain ? `; domain=${domain}` : '';
}

function secureAttr(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return '; Secure';
  }
  if (process.env.NODE_ENV === 'production') return '; Secure';
  return '';
}

function readBrowserCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/** Herhangi bir yüzeyde çıkış — tüm alt alanlarda Firebase yeniden girişini engeller */
export function markGlobalLogout(): void {
  if (typeof document === 'undefined') return;
  document.cookie =
    `${GLOBAL_LOGOUT_COOKIE}=${Date.now()}` +
    `; path=/; max-age=${GLOBAL_LOGOUT_TTL_SEC}; SameSite=Lax` +
    secureAttr() +
    cookieDomainAttr();
}

export function clearGlobalLogoutMarker(): void {
  if (typeof document === 'undefined') return;
  document.cookie =
    `${GLOBAL_LOGOUT_COOKIE}=` +
    `; path=/; max-age=0; SameSite=Lax` +
    secureAttr() +
    cookieDomainAttr();
  document.cookie = `${GLOBAL_LOGOUT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function isGlobalLogoutActive(): boolean {
  if (typeof document === 'undefined') return false;
  const raw = readBrowserCookie(GLOBAL_LOGOUT_COOKIE);
  if (!raw) return false;
  const at = Number(raw);
  if (!Number.isFinite(at) || Date.now() - at > GLOBAL_LOGOUT_TTL_MS) {
    clearGlobalLogoutMarker();
    return false;
  }
  return true;
}
