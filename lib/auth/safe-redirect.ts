/**
 * Validates post-login redirect targets to prevent open redirects.
 * Relative paths and trusted BiletFeed host URLs are allowed.
 */
export function isTrustedBiletFeedHost(hostname: string): boolean {
  const root =
    process.env.NEXT_PUBLIC_CANONICAL_HOST?.replace(/^www\./, '') ||
    process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split(':')[0]?.replace(/^www\./, '') ||
    'localhost';

  const normalized = hostname.replace(/^www\./, '');
  if (normalized === 'localhost' || normalized.endsWith('.localhost')) {
    return (
      normalized === 'localhost' ||
      normalized.startsWith('panel.localhost') ||
      normalized.startsWith('organizer.localhost') ||
      normalized.startsWith('destek.localhost')
    );
  }

  if (normalized === root) return true;
  return (
    normalized === `destek.${root}` ||
    normalized === `panel.${root}` ||
    normalized === `organizer.${root}`
  );
}

export function sanitizeRedirectPath(
  raw: string | null | undefined,
  fallback = '/'
): string {
  if (!raw) return fallback;

  const trimmed = raw.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      if (
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        isTrustedBiletFeedHost(url.hostname)
      ) {
        return url.toString();
      }
      return fallback;
    } catch {
      return fallback;
    }
  }

  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  if (trimmed.includes('://') || trimmed.includes('\\')) {
    return fallback;
  }

  if (/[\x00-\x1f\x7f]/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

/** Validates payment / checkout redirect URLs are same-origin. */
export function isAllowedAppRedirectUrl(
  url: string,
  allowedOrigins: string[]
): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    return allowedOrigins.some((origin) => parsed.origin === origin);
  } catch {
    return false;
  }
}
