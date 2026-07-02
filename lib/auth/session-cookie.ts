import { getCookieDomain } from '@/lib/config/domain';

export const SESSION_COOKIE_NAME = 'session';
export const PANEL_SESSION_COOKIE_NAME = 'panel_session';

export function getSessionCookieOptions(maxAgeSeconds: number) {
  const cookieDomain = getCookieDomain();
  return {
    maxAge: maxAgeSeconds,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...(cookieDomain ? { domain: cookieDomain } : {})
  };
}
