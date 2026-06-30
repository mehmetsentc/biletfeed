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

/** Üretim panel URL'si — https://panel.biletfeed.com/... */
export function getPanelUrl(path = ''): string {
  const host = canonicalHost.split(':')[0];
  const port = canonicalHost.includes(':')
    ? `:${canonicalHost.split(':')[1]}`
    : '';
  const panelHost =
    host === 'localhost' ? `panel.localhost${port}` : `${PANEL_SUBDOMAIN}.${host}`;
  return `${protocol}://${panelHost}${path}`;
}

/** Oturum çerezi — tüm alt alan adlarında paylaşım (.biletfeed.com) */
export function getCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined;
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
