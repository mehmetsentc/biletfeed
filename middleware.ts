import { type NextRequest, NextResponse } from 'next/server';
import { rootDomain, protocol, canonicalHost } from '@/lib/config/domain';

const PROTECTED_PREFIXES = ['/dashboard', '/admin'];
const AUTH_PATHS = ['/giris', '/kayit', '/sifremi-unuttum'];
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
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
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

  if (AUTH_PATHS.includes(pathname)) {
    const session = request.cookies.get(SESSION_COOKIE_NAME);
    if (session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|[\\w-]+\\.\\w+).*)']
};
