export const protocol =
  process.env.NODE_ENV === 'production' ? 'https' : 'http';

export const rootDomain =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

/** Host without www — used for canonical URLs and redirects */
export const canonicalHost =
  process.env.NEXT_PUBLIC_CANONICAL_HOST ||
  rootDomain.replace(/^www\./, '');

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
