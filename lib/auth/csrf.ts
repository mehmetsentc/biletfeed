import type { NextRequest } from 'next/server';

function collectExpectedOrigins(host: string): Set<string> {
  const expected = new Set<string>();
  for (const proto of ['https', 'http']) {
    expected.add(`${proto}://${host}`);
  }
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      expected.add(new URL(siteUrl).origin);
    } catch {
      /* ignore */
    }
  }
  return expected;
}

/**
 * Tarayıcı kaynaklı POST/PATCH/DELETE için CSRF koruması.
 * Origin veya Referer zorunlu; ikisi de yoksa istek reddedilir.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const host = request.headers.get('host');
  if (!host) return false;

  const expected = collectExpectedOrigins(host);
  const origin = request.headers.get('origin');
  if (origin) {
    return expected.has(origin);
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return expected.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return false;
}
