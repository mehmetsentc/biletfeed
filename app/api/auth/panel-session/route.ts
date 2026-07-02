import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { buildSignedSessionToken } from '@/lib/auth/session-crypto';
import {
  PANEL_SESSION_COOKIE_NAME,
  getSessionCookieOptions
} from '@/lib/auth/session-cookie';
import { SESSION_EXPIRES_MS } from '@/lib/auth/session';
import { syncUserToDB } from '@/lib/auth/sync-user';
import { verifyIdTokenViaRestApi } from '@/lib/auth/verify-id-token';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

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
    const limited = rateLimitOrNull(request, 'auth-panel-session', 60, 60_000);
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
      PANEL_SESSION_COOKIE_NAME,
      sessionCookie,
      getSessionCookieOptions(SESSION_EXPIRES_MS / 1000)
    );
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

  const response = NextResponse.json({ success: true });
  response.cookies.set(
    PANEL_SESSION_COOKIE_NAME,
    '',
    getSessionCookieOptions(0)
  );
  return response;
}
