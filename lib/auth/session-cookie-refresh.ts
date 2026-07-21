import { NextResponse } from 'next/server';
import {
  SESSION_EXPIRES_MS,
  type SessionUser
} from '@/lib/auth/session';
import { setUnifiedAuthCookies } from '@/lib/auth/unified-session-cookies';

/** Oturum çerezlerini `.biletfeed.com` ile yeniler — ana site + panel SSO */
export function attachSharedSessionCookie(
  response: NextResponse,
  session: SessionUser
): NextResponse {
  return setUnifiedAuthCookies(
    response,
    session.uid,
    session.email ?? '',
    session.role,
    SESSION_EXPIRES_MS
  );
}
