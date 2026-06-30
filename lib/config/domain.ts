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

/** Üretim ortamında gerçek domain (localhost değil) */
export function isProductionHost(): boolean {
  const host = canonicalHost.split(':')[0];
  return host !== 'localhost' && host.includes('.');
}

/** Üretim panel URL'si — https://panel.biletfeed.com/... */
export function getPanelUrl(path = ''): string {
  const host = canonicalHost.split(':')[0];
  const port = canonicalHost.includes(':')
    ? `:${canonicalHost.split(':')[1]}`
    : '';
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
  const host = canonicalHost.split(':')[0];
  if (host === 'localhost' || !host.includes('.')) return undefined;
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
