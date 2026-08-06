import { NextRequest, NextResponse } from 'next/server';
import { verifySignedSessionToken } from '@/lib/auth/session-crypto';
import { setUnifiedAuthCookies } from '@/lib/auth/unified-session-cookies';
import { SESSION_EXPIRES_MS } from '@/lib/auth/session';
import { toPanelPublicPath } from '@/lib/auth/panel-paths';
import { sanitizeRedirectPath } from '@/lib/auth/safe-redirect';
import { getPanelUrl, panelLoginHref } from '@/lib/config/domain';
import { rateLimitOrNullAsync } from '@/lib/security/rate-limit';
import type { UserRole } from '@/types';

/**
 * Safari/panel handoff tüketimi — app'teki kullanıcı için çerez yazar, hedefe yönlendirir.
 */
export async function GET(request: NextRequest) {
  const limited = await rateLimitOrNullAsync(
    request,
    'auth-panel-bridge',
    60,
    60_000
  );
  if (limited) return limited;

  const token = request.nextUrl.searchParams.get('t');
  const rawRedirect = request.nextUrl.searchParams.get('redirect');
  const redirectPath = toPanelPublicPath(
    sanitizeRedirectPath(rawRedirect, '/baslangic')
  );

  const failUrl = panelLoginHref(
    redirectPath.startsWith('/organizator-panel')
      ? redirectPath
      : `/organizator-panel${redirectPath}`
  );

  if (!token) {
    return NextResponse.redirect(failUrl);
  }

  const payload = verifySignedSessionToken(token);
  if (
    !payload ||
    payload.purpose !== 'panel-handoff' ||
    typeof payload.uid !== 'string' ||
    typeof payload.exp !== 'number' ||
    Date.now() > payload.exp
  ) {
    return NextResponse.redirect(failUrl);
  }

  const response = NextResponse.redirect(getPanelUrl(redirectPath));
  setUnifiedAuthCookies(
    response,
    payload.uid,
    typeof payload.email === 'string' ? payload.email : '',
    (typeof payload.role === 'string' ? payload.role : 'ROLE_USER') as UserRole,
    SESSION_EXPIRES_MS
  );
  return response;
}
