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

/** Kapı / bilet tarama terminali — giris.biletfeed.com */
export const GIRIS_SUBDOMAIN = 'giris';

/** Admin paneli — admin.biletfeed.com */
export const ADMIN_SUBDOMAIN = 'admin';

/** Platform alt alanları — organizatör vanity host rewrite'ına düşmesin */
export const RESERVED_PLATFORM_SUBDOMAINS = [
  PANEL_SUBDOMAIN,
  'organizer',
  SUPPORT_SUBDOMAIN,
  GIRIS_SUBDOMAIN,
  ADMIN_SUBDOMAIN,
  'www',
  'api',
  'mail',
  'cdn'
] as const;

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

export function isGirisSubdomain(subdomain: string | null): boolean {
  return subdomain === GIRIS_SUBDOMAIN;
}

export function isAdminSubdomain(subdomain: string | null): boolean {
  return subdomain === ADMIN_SUBDOMAIN;
}

export function isReservedPlatformSubdomain(subdomain: string | null): boolean {
  return (
    subdomain !== null &&
    (RESERVED_PLATFORM_SUBDOMAINS as readonly string[]).includes(subdomain)
  );
}

function buildSubdomainHost(subdomain: string): string {
  const rootHost = resolveProductionRootHost();
  const devHost = canonicalHost.split(':')[0];
  const port = canonicalHost.includes(':')
    ? `:${canonicalHost.split(':')[1]}`
    : '';
  const host = rootHost ?? devHost;
  return host === 'localhost'
    ? `${subdomain}.localhost${port}`
    : `${subdomain}.${host}`;
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
  const panelHost = buildSubdomainHost(PANEL_SUBDOMAIN);

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
  const supportHost = buildSubdomainHost(SUPPORT_SUBDOMAIN);

  if (!path || path === '/') {
    return `${protocol}://${supportHost}/`;
  }

  const normalized = normalizeSupportPath(path);

  return `${protocol}://${supportHost}${normalized}`;
}

/** Kapı tarama terminali — https://giris.biletfeed.com/... */
export function getGirisUrl(path = ''): string {
  const girisHost = buildSubdomainHost(GIRIS_SUBDOMAIN);
  if (!path || path === '/') {
    return `${protocol}://${girisHost}/`;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${protocol}://${girisHost}${normalized}`;
}

/** `/admin` önekini kaldırır — admin.biletfeed.com temiz path için */
export function normalizeAdminPath(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  if (withSlash === '/admin') return '/';
  if (withSlash.startsWith('/admin/')) {
    return withSlash.replace(/^\/admin/, '') || '/';
  }
  return withSlash;
}

/** Üretim admin URL'si — https://admin.biletfeed.com/... */
export function getAdminUrl(path = ''): string {
  const adminHost = buildSubdomainHost(ADMIN_SUBDOMAIN);
  if (!path || path === '/') {
    return `${protocol}://${adminHost}/`;
  }
  const normalized = normalizeAdminPath(path);
  return `${protocol}://${adminHost}${normalized === '/' ? '/' : normalized}`;
}

/** Kapı girişi / tarayıcı linki — production'da giris alt alanı */
export function girisHref(path = '/'): string {
  const normalized =
    !path || path === '/'
      ? '/'
      : path.startsWith('/')
        ? path
        : `/${path}`;
  if (!isProductionHost()) {
    if (normalized === '/' || normalized === '/giris') {
      return '/giris-terminal';
    }
    if (normalized === '/tarayici' || normalized.startsWith('/tarayici/')) {
      return `/giris-terminal${normalized === '/tarayici' ? '/tarayici' : normalized}`;
    }
    return normalized.startsWith('/giris-terminal')
      ? normalized
      : `/giris-terminal${normalized}`;
  }
  return getGirisUrl(normalized);
}

/** Admin linki — production'da admin alt alanı, dev'de /admin */
export function adminHref(path = '/'): string {
  const stripped = normalizeAdminPath(path);
  const devPath = stripped === '/' ? '/admin' : `/admin${stripped}`;
  if (!isProductionHost()) return devPath;
  return getAdminUrl(stripped);
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

/** İstemci: kapı tarama (giris) alt alanında mı? */
export function isOnGirisHost(hostname: string): boolean {
  const root = resolveProductionRootHost();
  if (root) {
    return hostname === `${GIRIS_SUBDOMAIN}.${root}`;
  }
  return hostname.startsWith('giris.localhost');
}

/** İstemci: admin alt alanında mı? */
export function isOnAdminHost(hostname: string): boolean {
  const root = resolveProductionRootHost();
  if (root) {
    return hostname === `${ADMIN_SUBDOMAIN}.${root}`;
  }
  return hostname.startsWith('admin.localhost');
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
