import { type NextRequest, NextResponse } from 'next/server';
import {
  canonicalHost,
  getAdminUrl,
  getPanelUrl,
  getSupportUrl,
  isAccountSitePath,
  isAdminSubdomain,
  isGirisSubdomain,
  isLegalSitePath,
  isOrganizerPanelSubdomain,
  isProductionHost,
  isReservedPlatformSubdomain,
  isSupportSubdomain,
  isDestekAppPath,
  protocol,
  normalizeAdminPath,
  normalizeSupportPath,
  resolveProductionRootHost,
  rootDomain,
  siteHref
} from '@/lib/config/domain';
import { isEventJoyEnabled } from '@/lib/config/features';
import {
  LOCALE_COOKIE,
  resolveLocaleFromAcceptLanguage
} from '@/lib/i18n/locale';
import {
  mapLegacyDashboardPath,
  mapLegacyDashboardToDevPanelPath
} from '@/lib/routing/legacy-dashboard';

const SESSION_COOKIE_NAME = 'session';
const PANEL_SESSION_COOKIE_NAME = 'panel_session';

function applyDeviceLocale(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const locale = resolveLocaleFromAcceptLanguage(
    request.headers.get('accept-language')
  );
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  });
  response.headers.set('x-bf-locale', locale);
  return response;
}

/** RSC'ye cihaz dilini iletmek için request header + cookie */
function nextWithLocale(request: NextRequest): NextResponse {
  const locale = resolveLocaleFromAcceptLanguage(
    request.headers.get('accept-language')
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-bf-locale', locale);
  const response = NextResponse.next({
    request: { headers: requestHeaders }
  });
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  });
  return response;
}

function withLocale(request: NextRequest, response: NextResponse): NextResponse {
  return applyDeviceLocale(request, response);
}

const PANEL_PUBLIC_PATHS = new Set([
  '/giris',
  '/organizator-panel/giris',
  '/sifremi-unuttum'
]);

const GIRIS_PUBLIC_PATHS = new Set(['/', '/giris', '/giris-terminal']);

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

  // Ana siteden gelen /organizator-panel/* panel'e
  // (tarayıcı yolu panelde kalır — kapı ekibi giris.biletfeed.com kullanır)

  const cleanPath =
    pathname.replace(/^\/organizator-panel/, '') || '/baslangic';
  return NextResponse.redirect(getPanelUrl(cleanPath), 308);
}

/** Eski /dashboard/* rotalarını organizatör paneline yönlendir */
function redirectLegacyDashboardToPanel(
  request: NextRequest,
  pathname: string
): NextResponse | null {
  if (!pathname.startsWith('/dashboard')) return null;

  const panelPath = mapLegacyDashboardPath(pathname);

  if (isProductionHost()) {
    return NextResponse.redirect(getPanelUrl(panelPath), 308);
  }

  return NextResponse.redirect(
    new URL(mapLegacyDashboardToDevPanelPath(pathname), request.url),
    308
  );
}

function redirectSupportToSubdomain(
  request: NextRequest,
  pathname: string
): NextResponse | null {
  if (!isProductionHost()) return null;
  if (
    !isDestekAppPath(pathname) &&
    pathname !== '/destek-talebi'
  ) {
    return null;
  }

  const subdomain = extractSubdomain(request);
  if (subdomain) return null;

  const cleanPath = normalizeSupportPath(pathname);
  return NextResponse.redirect(getSupportUrl(cleanPath), 308);
}

function redirectAdminToSubdomain(
  request: NextRequest,
  pathname: string
): NextResponse | null {
  if (!isProductionHost()) return null;
  if (pathname !== '/admin' && !pathname.startsWith('/admin/')) return null;

  const subdomain = extractSubdomain(request);
  if (subdomain) return null;

  return NextResponse.redirect(getAdminUrl(normalizeAdminPath(pathname)), 308);
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
    isDestekAppPath(pathname) ||
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
    return NextResponse.redirect(new URL('/baslangic', request.url));
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

  if (isAccountSitePath(pathname)) {
    const target = siteHref(pathname);
    if (target.startsWith('http')) {
      return NextResponse.redirect(target);
    }
  }

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

  const panelPath = pathname.startsWith('/')
    ? `/organizator-panel${pathname}`
    : `/organizator-panel/${pathname}`;
  return NextResponse.rewrite(new URL(panelPath, request.url));
}

/** Kapı terminali — sadece login + tarayıcı */
function handleGirisSubdomain(
  request: NextRequest,
  pathname: string
): NextResponse {
  if (isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Kapı kodu giriş sayfası
  if (
    GIRIS_PUBLIC_PATHS.has(pathname) ||
    pathname === '/giris-terminal' ||
    pathname.startsWith('/giris-terminal/')
  ) {
    const rewriteUrl = new URL('/giris-terminal', request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      rewriteUrl.searchParams.set(key, value);
    });
    return NextResponse.rewrite(rewriteUrl);
  }

  // QR tarayıcı — panel layout'undan bağımsız
  if (pathname === '/tarayici' || pathname.startsWith('/tarayici/')) {
    const panelSession = request.cookies.get(PANEL_SESSION_COOKIE_NAME);
    if (!panelSession?.value) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', '/tarayici');
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.rewrite(
      new URL('/giris-terminal/tarayici', request.url)
    );
  }

  // Diğer yollar kapı terminalinde yok
  return NextResponse.redirect(new URL('/', request.url));
}

function handleAdminSubdomain(
  request: NextRequest,
  pathname: string
): NextResponse {
  if (isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME);
  if (!session?.value) {
    const loginTarget = siteHref('/giris');
    const loginUrl = loginTarget.startsWith('http')
      ? new URL(loginTarget)
      : new URL('/giris', request.url);
    const returnTo =
      pathname === '/' || pathname === '/admin'
        ? getAdminUrl('/')
        : getAdminUrl(normalizeAdminPath(pathname));
    loginUrl.searchParams.set('redirect', returnTo);
    return NextResponse.redirect(loginUrl);
  }

  if (
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  ) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/admin', request.url));
  }

  const adminPath = pathname.startsWith('/')
    ? `/admin${pathname}`
    : `/admin/${pathname}`;
  return NextResponse.rewrite(new URL(adminPath, request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isEventJoyEnabled && pathname.startsWith('/eventjoy')) {
    return withLocale(request, NextResponse.redirect(new URL('/', request.url)));
  }

  const panelRedirect = redirectOrganizerPanelToSubdomain(request, pathname);
  if (panelRedirect) return withLocale(request, panelRedirect);

  const dashboardRedirect = redirectLegacyDashboardToPanel(request, pathname);
  if (dashboardRedirect) return withLocale(request, dashboardRedirect);

  const supportRedirect = redirectSupportToSubdomain(request, pathname);
  if (supportRedirect) return withLocale(request, supportRedirect);

  const adminRedirect = redirectAdminToSubdomain(request, pathname);
  if (adminRedirect) return withLocale(request, adminRedirect);

  const canonicalRedirect = redirectToCanonical(request);
  if (canonicalRedirect) return withLocale(request, canonicalRedirect);

  const subdomain = extractSubdomain(request);

  if (!subdomain && pathname.startsWith('/destek-talebi')) {
    const supportPath = pathname.replace(
      /^\/destek-talebi/,
      '/destek/destek-talebi'
    );
    return withLocale(
      request,
      NextResponse.rewrite(new URL(supportPath, request.url))
    );
  }

  if (isSupportSubdomain(subdomain)) {
    if (pathname === '/') {
      return withLocale(
        request,
        NextResponse.rewrite(new URL('/destek', request.url))
      );
    }
    return withLocale(request, handleSupportSubdomain(request, pathname));
  }

  if (isGirisSubdomain(subdomain)) {
    return withLocale(request, handleGirisSubdomain(request, pathname));
  }

  if (isAdminSubdomain(subdomain)) {
    return withLocale(request, handleAdminSubdomain(request, pathname));
  }

  if (isOrganizerPanelSubdomain(subdomain)) {
    return withLocale(request, handleOrganizerPanelSubdomain(request, pathname));
  }

  if (subdomain && !isReservedPlatformSubdomain(subdomain)) {
    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/organizator-panel')
    ) {
      return withLocale(
        request,
        NextResponse.redirect(new URL('/', request.url))
      );
    }

    if (pathname === '/') {
      return withLocale(
        request,
        NextResponse.rewrite(new URL(`/organizator/${subdomain}`, request.url))
      );
    }

    if (pathname.startsWith('/etkinlik/')) {
      return nextWithLocale(request);
    }
  }

  if (pathname.startsWith('/organizator-panel')) {
    if (!isPanelPublicPath(pathname)) {
      const panelSession = request.cookies.get(PANEL_SESSION_COOKIE_NAME);
      if (!panelSession?.value) {
        const loginUrl = new URL('/organizator-panel/giris', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return withLocale(request, NextResponse.redirect(loginUrl));
      }
    }
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const session = request.cookies.get(SESSION_COOKIE_NAME);
    if (!session) {
      const loginUrl = new URL('/giris', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return withLocale(request, NextResponse.redirect(loginUrl));
    }
  }

  return nextWithLocale(request);
}

export const config = {
  matcher: ['/((?!api|_next|[\\w-]+\\.\\w+).*)']
};
