/**
 * Validates post-login redirect targets to prevent open redirects.
 * Only same-origin relative paths are allowed.
 */
export function sanitizeRedirectPath(
  raw: string | null | undefined,
  fallback = '/'
): string {
  if (!raw) return fallback;

  const trimmed = raw.trim();
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
