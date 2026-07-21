import { NextResponse } from 'next/server';
import { buildSignedSessionToken } from '@/lib/auth/session-crypto';
import {
  PANEL_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions
} from '@/lib/auth/session-cookie';
import { SESSION_EXPIRES_MS } from '@/lib/auth/session';

/** Aynı kullanıcı için ana site + panel + admin SSO — iki çerezi birlikte yazar */
export function setUnifiedAuthCookies(
  response: NextResponse,
  uid: string,
  email: string,
  role: string,
  expiresMs: number = SESSION_EXPIRES_MS
): NextResponse {
  const token = buildSignedSessionToken({
    uid,
    email,
    role,
    exp: Date.now() + expiresMs
  });
  const options = getSessionCookieOptions(expiresMs / 1000);
  response.cookies.set(SESSION_COOKIE_NAME, token, options);
  response.cookies.set(PANEL_SESSION_COOKIE_NAME, token, options);
  return response;
}
