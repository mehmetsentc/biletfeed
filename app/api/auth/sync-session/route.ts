import { NextRequest, NextResponse } from 'next/server';
import { sanitizeRedirectPath } from '@/lib/auth/safe-redirect';
import { attachSharedSessionCookie } from '@/lib/auth/session-cookie-refresh';
import { verifySessionCookie } from '@/lib/auth/session';
import { getSiteUrl, getSupportUrl } from '@/lib/config/domain';

export const dynamic = 'force-dynamic';

/**
 * Ana sitede okunan oturumu `.biletfeed.com` çerez domain'ine yazar ve
 * destek/panel alt alanına geri yönlendirir.
 */
export async function GET(request: NextRequest) {
  const redirectTarget = sanitizeRedirectPath(
    request.nextUrl.searchParams.get('redirect'),
    getSupportUrl('/')
  );

  const session = await verifySessionCookie();
  if (!session) {
    const loginUrl = new URL(getSiteUrl('/giris'));
    loginUrl.searchParams.set('redirect', redirectTarget);
    return NextResponse.redirect(loginUrl.toString());
  }

  const response = NextResponse.redirect(redirectTarget);
  return attachSharedSessionCookie(response, session);
}
