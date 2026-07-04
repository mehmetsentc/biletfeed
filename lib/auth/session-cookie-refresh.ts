import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  SESSION_EXPIRES_MS,
  buildSessionCookie,
  type SessionUser
} from '@/lib/auth/session';
import { getSessionCookieOptions } from '@/lib/auth/session-cookie';

/** Oturum çerezini `.biletfeed.com` domain ile yeniden yazar — alt alan paylaşımı. */
export function attachSharedSessionCookie(
  response: NextResponse,
  session: SessionUser
): NextResponse {
  const token = buildSessionCookie(
    session.uid,
    session.email ?? '',
    session.role,
    SESSION_EXPIRES_MS
  );
  response.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    getSessionCookieOptions(SESSION_EXPIRES_MS / 1000)
  );
  return response;
}
