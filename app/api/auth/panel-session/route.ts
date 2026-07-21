import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { setUnifiedAuthCookies } from '@/lib/auth/unified-session-cookies';
import { SESSION_EXPIRES_MS } from '@/lib/auth/session';
import {
  PANEL_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions
} from '@/lib/auth/session-cookie';
import { syncUserToDB } from '@/lib/auth/sync-user';
import { verifyIdTokenViaRestApi } from '@/lib/auth/verify-id-token';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimitOrNull(request, 'auth-panel-session', 200, 60_000);
    if (limited) return limited;

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
    }

    const body = (await request.json()) as { idToken?: string };
    const { idToken } = body;
    if (!idToken) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 400 });
    }

    const { uid, email } = await verifyIdTokenViaRestApi(idToken);
    const role = await syncUserToDB(uid, email);

    const response = NextResponse.json({ success: true, role });
    setUnifiedAuthCookies(response, uid, email, role, SESSION_EXPIRES_MS);
    return response;
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes('NEXTAUTH_SECRET')
        ? 'Sunucu oturum anahtarı yapılandırılmamış (NEXTAUTH_SECRET).'
        : 'Panel oturumu oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const { SCANNER_GATE_SCOPE_COOKIE } = await import(
    '@/lib/auth/scanner-gate-scope'
  );
  const response = NextResponse.json({ success: true });
  const shared = getSessionCookieOptions(0);
  for (const name of [
    SESSION_COOKIE_NAME,
    PANEL_SESSION_COOKIE_NAME,
    SCANNER_GATE_SCOPE_COOKIE
  ]) {
    response.cookies.set(name, '', shared);
    response.cookies.set(name, '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  }
  return response;
}
