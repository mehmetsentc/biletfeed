import { type NextRequest, NextResponse } from 'next/server';
import {
  canonicalHost,
  getPanelUrl,
  isOrganizerPanelSubdomain,
  isProductionHost,
  protocol,
  resolveProductionRootHost,
  rootDomain,
} from '@/lib/config/domain';

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

  const rootDomainFormatted =
    resolveProductionRootHost() ?? rootDomain.split(':')[0];

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

function redirectOrganizerPanelToSubdomain(
  request: NextRequest,
  pathname: string
): NextResponse | null {
  if (!isProductionHost()) return null;
  if (!pathname.startsWith('/organizator-panel')) return null;

  const subdomain = extractSubdomain(request);
  if (subdomain) return null;

  const cleanPath =
    pathname.replace(/^\/organizator-panel/, '') || '/baslangic';
  return NextResponse.redirect(getPanelUrl(cleanPath), 308);
}

function redirectToCanonical(request: NextRequest): NextResponse | null {
  if (!isProductionHost()) return null;

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

function isStaticAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith('/brand/') ||
    pathname.startsWith('/images/') ||
    /\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|css|js|map)$/i.test(pathname)
  );
}

function handleOrganizerPanelSubdomain(
  request: NextRequest,
  pathname: string
): NextResponse {
  if (isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL('/baslangic', request.url)
    );
  }

  if (
    pathname.startsWith('/organizator-panel') ||
    pathname.startsWith('/giris') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // panel.biletfeed.com/tarayici → /organizator-panel/tarayici
  const panelPath = pathname.startsWith('/')
    ? `/organizator-panel${pathname}`
    : `/organizator-panel/${pathname}`;
  return NextResponse.rewrite(new URL(panelPath, request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const panelRedirect = redirectOrganizerPanelToSubdomain(request, pathname);
  if (panelRedirect) return panelRedirect;

  const canonicalRedirect = redirectToCanonical(request);
  if (canonicalRedirect) return canonicalRedirect;

  const subdomain = extractSubdomain(request);

  if (isOrganizerPanelSubdomain(subdomain)) {
    return handleOrganizerPanelSubdomain(request, pathname);
  }

  if (subdomain) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|[\\w-]+\\.\\w+).*)']
};
