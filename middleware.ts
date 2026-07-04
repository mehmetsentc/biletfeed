import { type NextRequest, NextResponse } from 'next/server';
import {
  canonicalHost,
  getPanelUrl,
  getSupportUrl,
  isAccountSitePath,
  isLegalSitePath,
  isOrganizerPanelSubdomain,
  isProductionHost,
  isSupportSubdomain,
  protocol,
  normalizeSupportPath,
  resolveProductionRootHost,
  rootDomain,
  siteHref,
} from '@/lib/config/domain';
import { isEventJoyEnabled } from '@/lib/config/features';

const PROTECTED_PREFIXES = ['/dashboard', '/admin'];
const SESSION_COOKIE_NAME = 'session';
const PANEL_SESSION_COOKIE_NAME = 'panel_session';

const PANEL_PUBLIC_PATHS = new Set([
  '/giris',
  '/organizator-panel/giris',
  '/sifremi-unuttum'
]);

function isPanelPublicPath(pathname: string): boolean {
  if (PANEL_PUBLIC_PATHS.has(pathname)) return true;
  return (
    pathname.startsWith('/organizator-panel/giris') ||
    pathname.startsWith('/giris?')
  );
}

function requiresPanelSession(pathname: string): boolean {
  if (isPanelPublicPath(pathname)) return false;
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) return false;
  if (isLegalSitePath(pathname)) return false;
  return true;
}

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

function redirectSupportToSubdomain(
  request: NextRequest,
  pathname: string
): NextResponse | null {
  if (!isProductionHost()) return null;
  if (!pathname.startsWith('/destek')) return null;

  const subdomain = extractSubdomain(request);
  if (subdomain) return null;

  const cleanPath = normalizeSupportPath(pathname);
  return NextResponse.redirect(getSupportUrl(cleanPath), 308);
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

function handleSupportSubdomain(
  request: NextRequest,
  pathname: string
): NextResponse {
  if (isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/destek') ||
    pathname.startsWith('/giris') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // destek.biletfeed.com/kategori/sss → /destek/kategori/sss
  const supportPath = pathname.startsWith('/')
    ? `/destek${pathname}`
    : `/destek/${pathname}`;
  return NextResponse.rewrite(new URL(supportPath, request.url));
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

  // panel.biletfeed.com/giris → organizatör giriş sayfası
  if (pathname === '/giris' || pathname.startsWith('/giris/')) {
    const rewriteUrl = new URL('/organizator-panel/giris', request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      rewriteUrl.searchParams.set(key, value);
    });
    return NextResponse.rewrite(rewriteUrl);
  }

  if (requiresPanelSession(pathname)) {
    const panelSession = request.cookies.get(PANEL_SESSION_COOKIE_NAME);
    if (!panelSession?.value) {
      const loginUrl = new URL('/giris', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // panel.biletfeed.com/profil → biletfeed.com/profil (hesap sayfaları ana sitede)
  if (isAccountSitePath(pathname)) {
    const target = siteHref(pathname);
    if (target.startsWith('http')) {
      return NextResponse.redirect(target);
    }
  }

  // panel.biletfeed.com/organizator-sozlesmesi → doğrudan yasal sayfa (404 rewrite yok)
  if (isLegalSitePath(pathname)) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/organizator-panel') ||
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

  if (!isEventJoyEnabled && pathname.startsWith('/eventjoy')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const panelRedirect = redirectOrganizerPanelToSubdomain(request, pathname);
  if (panelRedirect) return panelRedirect;

  const supportRedirect = redirectSupportToSubdomain(request, pathname);
  if (supportRedirect) return supportRedirect;

  const canonicalRedirect = redirectToCanonical(request);
  if (canonicalRedirect) return canonicalRedirect;

  const subdomain = extractSubdomain(request);

  // Ana sitede kısa destek yolları → /destek/* rotalarına
  if (!subdomain && pathname.startsWith('/destek-talebi')) {
    const supportPath = pathname.replace(
      /^\/destek-talebi/,
      '/destek/destek-talebi'
    );
    return NextResponse.rewrite(new URL(supportPath, request.url));
  }

  if (isSupportSubdomain(subdomain)) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/destek', request.url));
    }
    return handleSupportSubdomain(request, pathname);
  }

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

  if (pathname.startsWith('/organizator-panel')) {
    if (!isPanelPublicPath(pathname)) {
      const panelSession = request.cookies.get(PANEL_SESSION_COOKIE_NAME);
      if (!panelSession?.value) {
        const loginUrl = new URL('/organizator-panel/giris', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
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
