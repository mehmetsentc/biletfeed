import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  PANEL_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions
} from '@/lib/auth/session-cookie';
import { SCANNER_GATE_SCOPE_COOKIE } from '@/lib/auth/scanner-gate-scope';

const AUTH_COOKIES = [
  SESSION_COOKIE_NAME,
  PANEL_SESSION_COOKIE_NAME,
  SCANNER_GATE_SCOPE_COOKIE
] as const;

/** Domain'li + host-only kopyaları temizler */
function clearAuthCookies(response: NextResponse) {
  const shared = getSessionCookieOptions(0);
  for (const name of AUTH_COOKIES) {
    response.cookies.set(name, '', shared);
    response.cookies.set(name, '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  }
}

/** Tüm yüzey oturumlarını sil (site + panel + kapı scope) */
export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}

export async function POST(request: NextRequest) {
  return DELETE(request);
}
