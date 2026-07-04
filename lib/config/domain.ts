export const protocol =
  process.env.NODE_ENV === 'production' ? 'https' : 'http';

export const rootDomain =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

/** Host without www — used for canonical URLs and redirects */
export const canonicalHost =
  process.env.NEXT_PUBLIC_CANONICAL_HOST ||
  rootDomain.replace(/^www\./, '');

/** Organizatör paneli alt alan adları — panel.biletfeed.com (birincil) */
export const PANEL_SUBDOMAIN = 'panel';

/** Genel destek merkezi — destek.biletfeed.com */
export const SUPPORT_SUBDOMAIN = 'destek';

export const ORGANIZER_PANEL_SUBDOMAINS = [PANEL_SUBDOMAIN, 'organizer'] as const;

export type OrganizerPanelSubdomain = (typeof ORGANIZER_PANEL_SUBDOMAINS)[number];

export function isOrganizerPanelSubdomain(
  subdomain: string | null
): subdomain is OrganizerPanelSubdomain {
  return (
    subdomain !== null &&
    (ORGANIZER_PANEL_SUBDOMAINS as readonly string[]).includes(subdomain)
  );
}

export function isSupportSubdomain(subdomain: string | null): boolean {
  return subdomain === SUPPORT_SUBDOMAIN;
}

/** Production kök domain — env'den çözülür (biletfeed.com) */
export function resolveProductionRootHost(): string | null {
  const rawCandidates = [
    process.env.NEXT_PUBLIC_CANONICAL_HOST,
    process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL
  ].filter((v): v is string => Boolean(v));

  for (const candidate of rawCandidates) {
    try {
      const host = candidate.includes('://')
        ? new URL(candidate).hostname
        : candidate.split(':')[0];
      const normalized = host.replace(/^www\./, '');
      if (
        normalized !== 'localhost' &&
        !normalized.endsWith('.vercel.app') &&
        normalized.includes('.')
      ) {
        return normalized;
      }
    } catch {
      continue;
    }
  }

  const fallback = canonicalHost.split(':')[0].replace(/^www\./, '');
  if (
    fallback !== 'localhost' &&
    !fallback.endsWith('.vercel.app') &&
    fallback.includes('.')
  ) {
    return fallback;
  }

  return null;
}

/** Üretim ortamında gerçek domain (localhost değil) */
export function isProductionHost(): boolean {
  if (process.env.NODE_ENV !== 'production') return false;
  return resolveProductionRootHost() !== null;
}

/** Üretim panel URL'si — https://panel.biletfeed.com/... */
export function getPanelUrl(path = ''): string {
  const rootHost = resolveProductionRootHost();
  const devHost = canonicalHost.split(':')[0];
  const port = canonicalHost.includes(':')
    ? `:${canonicalHost.split(':')[1]}`
    : '';
  const host = rootHost ?? devHost;
  const panelHost =
    host === 'localhost' ? `panel.localhost${port}` : `${PANEL_SUBDOMAIN}.${host}`;

  if (!path || path === '/') {
    return `${protocol}://${panelHost}/baslangic`;
  }

  const normalized = path.startsWith('/organizator-panel')
    ? path.replace(/^\/organizator-panel/, '') || '/baslangic'
    : path.startsWith('/')
      ? path
      : `/${path}`;

  return `${protocol}://${panelHost}${normalized}`;
}

/** `/destek` uygulama rotası mı — `/destek-talebi` dahil değil. */
export function isDestekAppPath(pathname: string): boolean {
  return pathname === '/destek' || pathname.startsWith('/destek/');
}

/** `/destek` önekini yalnızca `/destek` veya `/destek/...` için kaldırır — `/destek-talebi` korunur. */
export function normalizeSupportPath(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  if (withSlash === '/destek') return '/';
  if (withSlash.startsWith('/destek/')) {
    return withSlash.replace(/^\/destek/, '') || '/';
  }
  return withSlash;
}

/** Üretim destek merkezi URL'si — https://destek.biletfeed.com/... */
export function getSupportUrl(path = ''): string {
  const rootHost = resolveProductionRootHost();
  const devHost = canonicalHost.split(':')[0];
  const port = canonicalHost.includes(':')
    ? `:${canonicalHost.split(':')[1]}`
    : '';
  const host = rootHost ?? devHost;
  const supportHost =
    host === 'localhost'
      ? `${SUPPORT_SUBDOMAIN}.localhost${port}`
      : `${SUPPORT_SUBDOMAIN}.${host}`;

  if (!path || path === '/') {
    return `${protocol}://${supportHost}/`;
  }

  const normalized = normalizeSupportPath(path);

  return `${protocol}://${supportHost}${normalized}`;
}

/** Destek merkezi linki — production'da destek alt alanı, dev'de /destek yolu */
export function supportHref(path = ''): string {
  const normalized = normalizeSupportPath(path);
  const devPath =
    normalized === '/' ? '/destek' : `/destek${normalized}`;
  if (!isProductionHost()) return devPath;
  return getSupportUrl(normalized);
}

/** Ana sitede yaşayan hesap sayfaları — panel alt alanında route yok */
export const ACCOUNT_SITE_PATH_PREFIXES = [
  '/profil',
  '/biletlerim',
  '/favorilerim',
  '/degerlendirmelerim',
  '/bildirimler',
  '/eventjoy'
] as const;

/** Yasal / kurumsal sayfalar — yalnızca ana sitede (panel alt alanında 404 olmasın diye) */
export const LEGAL_SITE_PATH_PREFIXES = [
  '/gizlilik',
  '/kosullar',
  '/kullanici-sozlesmesi',
  '/organizator-sozlesmesi',
  '/uyelik-sozlesmesi',
  '/cerezler',
  '/hakkimizda',
  '/iletisim',
  '/sss',
  '/iade-iptal',
  '/iade-garantisi',
  '/mesafeli-satis',
  '/acik-riza-beyani',
  '/ticari-elektronik-ileti',
  '/biletfeed-panel'
] as const;

export function isAccountSitePath(pathname: string): boolean {
  return ACCOUNT_SITE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isLegalSitePath(pathname: string): boolean {
  return LEGAL_SITE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Panel alt alanından ana siteye yönlendirilmesi gereken yollar */
export function isMainSiteOnlyPath(pathname: string): boolean {
  return isAccountSitePath(pathname) || isLegalSitePath(pathname);
}

/** Hesap menüsü linki — panel alt alanındayken biletfeed.com'a yönlendirir */
export function accountSiteHref(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return siteHref(normalized);
}

/** İstemci: organizatör panel alt alanında mı? */
export function isOnOrganizerPanelHost(hostname: string): boolean {
  const root = resolveProductionRootHost();
  if (root) {
    return (
      hostname === `${PANEL_SUBDOMAIN}.${root}` ||
      hostname === `organizer.${root}`
    );
  }
  return (
    hostname.startsWith('panel.localhost') ||
    hostname.startsWith('organizer.localhost')
  );
}

/** Ana site linki — panel/destek alt alanından kök domain'e (biletfeed.com) */
export function siteHref(path = '/'): string {
  const normalized =
    !path || path === '/'
      ? '/'
      : path.startsWith('/')
        ? path
        : `/${path}`;

  if (!isProductionHost()) return normalized;

  const rootHost = resolveProductionRootHost();
  if (!rootHost) return normalized;

  return `${protocol}://${rootHost}${normalized}`;
}

/** Organizatör panel giriş sayfası */
export function panelLoginHref(redirect?: string): string {
  const query = redirect
    ? `?redirect=${encodeURIComponent(redirect)}`
    : '';
  if (!isProductionHost()) {
    return `/organizator-panel/giris${query}`;
  }
  return getPanelUrl(`/giris${query}`);
}

/** Profil / ana siteden panele — ayrı platform hissi için yeni sekme */
export const PANEL_EXTERNAL_LINK_PROPS = {
  target: '_blank',
  rel: 'noopener noreferrer'
} as const;

/** Organizatör panel linki — production'da panel alt alanı, dev'de göreli yol */
export function panelHref(path: string): string {
  const stripped = path.startsWith('/organizator-panel')
    ? path.replace(/^\/organizator-panel/, '') || '/baslangic'
    : path.startsWith('/')
      ? path
      : `/${path}`;
  const devPath = stripped.startsWith('/organizator-panel')
    ? stripped
    : `/organizator-panel${stripped}`;
  if (!isProductionHost()) return devPath;
  return getPanelUrl(stripped);
}

/** Oturum çerezi — tüm alt alan adlarında paylaşım (.biletfeed.com) */
export function getCookieDomain(): string | undefined {
  if (!isProductionHost()) return undefined;
  const host = resolveProductionRootHost();
  if (!host) return undefined;
  return `.${host}`;
}

export function getSiteUrl(path = ''): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    `${protocol}://${canonicalHost}`;
  return `${base.replace(/\/$/, '')}${path}`;
}

export function getCanonicalUrl(path = ''): string {
  return getSiteUrl(path);
}
