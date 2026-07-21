import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { buildSignedSessionToken } from '@/lib/auth/session-crypto';
import {
  PANEL_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions
} from '@/lib/auth/session-cookie';
import { SESSION_EXPIRES_MS } from '@/lib/auth/session';
import { syncUserToDB } from '@/lib/auth/sync-user';
import { verifyIdTokenViaRestApi } from '@/lib/auth/verify-id-token';
import { rateLimitOrNullAsync } from '@/lib/security/rate-limit';

function buildSessionCookie(
  uid: string,
  email: string,
  role: string,
  expiresMs: number
): string {
  return buildSignedSessionToken({
    uid,
    email,
    role,
    exp: Date.now() + expiresMs
  });
}

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimitOrNullAsync(request, 'auth-session', 60, 60_000);
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
    const sessionCookie = buildSessionCookie(uid, email, role, SESSION_EXPIRES_MS);

    const response = NextResponse.json({ success: true, role });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionCookie,
      getSessionCookieOptions(SESSION_EXPIRES_MS / 1000)
    );
    return response;
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes('NEXTAUTH_SECRET')
        ? 'Sunucu oturum anahtarı yapılandırılmamış (NEXTAUTH_SECRET).'
        : 'Oturum oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  // Tek yüzey silinse bile tüm auth çerezlerini temizle (çapraz alt alan sızıntısı)
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
