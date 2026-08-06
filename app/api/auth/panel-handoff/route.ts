import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { buildSignedSessionToken } from '@/lib/auth/session-crypto';
import {
  verifyOrganizerPanelSession,
  verifySessionCookie
} from '@/lib/auth/session';
import { toPanelPublicPath } from '@/lib/auth/panel-paths';
import { sanitizeRedirectPath } from '@/lib/auth/safe-redirect';
import { getPanelUrl } from '@/lib/config/domain';
import { rateLimitOrNullAsync } from '@/lib/security/rate-limit';

const HANDOFF_TTL_MS = 120_000;

/**
 * Native app → Safari panel köprüsü.
 * App WebView oturumundan kısa ömürlü token üretir; Safari bridge bu token ile
 * panel_session yazar (eski Safari hesabının üzerine yazar).
 */
export async function POST(request: NextRequest) {
  const limited = await rateLimitOrNullAsync(
    request,
    'auth-panel-handoff',
    30,
    60_000
  );
  if (limited) return limited;

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session =
    (await verifySessionCookie()) ?? (await verifyOrganizerPanelSession());
  if (!session) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
  }

  let redirectPath = '/etkinlik/yeni';
  try {
    const body = (await request.json()) as { redirect?: string };
    const sanitized = sanitizeRedirectPath(body.redirect, '/etkinlik/yeni');
    if (sanitized.startsWith('/') && !sanitized.startsWith('//')) {
      redirectPath = toPanelPublicPath(sanitized);
    }
  } catch {
    // default
  }

  const handoff = buildSignedSessionToken({
    uid: session.uid,
    email: session.email ?? '',
    role: session.role,
    purpose: 'panel-handoff',
    exp: Date.now() + HANDOFF_TTL_MS
  });

  const bridgeUrl = new URL(getPanelUrl('/api/auth/panel-bridge'));
  bridgeUrl.searchParams.set('t', handoff);
  bridgeUrl.searchParams.set('redirect', redirectPath);

  return NextResponse.json({
    bridgeUrl: bridgeUrl.toString(),
    expiresInSec: HANDOFF_TTL_MS / 1000
  });
}
