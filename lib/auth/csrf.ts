import type { NextRequest } from 'next/server';

/**
 * Rejects cross-site POST/PATCH/DELETE when the browser sends Origin/Referer.
 * Cookie-authenticated routes should call this before handling mutations.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const host = request.headers.get('host');
  if (!host) return false;

  const expected = new Set<string>();
  for (const proto of ['https', 'http']) {
    expected.add(`${proto}://${host}`);
  }

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

  // Non-browser clients (cron, webhooks) omit both headers.
  return true;
}
