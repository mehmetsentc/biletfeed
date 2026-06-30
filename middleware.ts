import { type NextRequest, NextResponse } from 'next/server';
import { rootDomain, protocol, canonicalHost } from '@/lib/config/domain';

const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/organizator-panel'];
const SESSION_COOKIE_NAME = 'session';

function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
    if (fullUrlMatch?.[1]) return fullUrlMatch[1];

    if (hostname.includes('.localhost')) {
      return hostname.split('.')[0];
    }
    return null;
  }

  const rootDomainFormatted = rootDomain.split(':')[0];

  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('---');
    return parts.length > 0 ? parts[0] : null;
  }

  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  return isSubdomain ? hostname.replace(`.${rootDomainFormatted}`, '') : null;
}

function redirectToCanonical(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null;

  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];
  const canonical = canonicalHost.split(':')[0];

  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto === 'http') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  if (hostname === `www.${canonical}`) {
    const url = request.nextUrl.clone();
    url.host = host.replace(/^www\./, '');
    url.protocol = protocol;
    return NextResponse.redirect(url, 301);
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const canonicalRedirect = redirectToCanonical(request);
  if (canonicalRedirect) return canonicalRedirect;

  const { pathname } = request.nextUrl;
  const subdomain = extractSubdomain(request);

  if (subdomain) {
    if (subdomain === 'organizer') {
      if (pathname === '/') {
        return NextResponse.redirect(
          new URL('/organizator-panel/baslangic', request.url)
        );
      }
      if (
        pathname.startsWith('/organizator-panel') ||
        pathname.startsWith('/giris') ||
        pathname.startsWith('/api')
      ) {
        return NextResponse.next();
      }
      return NextResponse.redirect(
        new URL(`/organizator-panel/baslangic`, request.url)
      );
    }

    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/organizator-panel')
    ) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (pathname === '/') {
      return NextResponse.rewrite(
        new URL(`/organizator/${subdomain}`, request.url)
      );
    }

    if (pathname.startsWith('/etkinlik/')) {
      return NextResponse.next();
    }
  }

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const session = request.cookies.get(SESSION_COOKIE_NAME);
    if (!session) {
      const loginUrl = new URL('/giris', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Giriş sayfasında çerez varlığına göre sunucu yönlendirmesi yapma —
  // geçersiz/eskimiş çerezler /admin ↔ /giris döngüsüne yol açar.
  // Yönlendirme istemci tarafında oturum doğrulandıktan sonra yapılır.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|[\\w-]+\\.\\w+).*)']
};
