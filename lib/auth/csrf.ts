import type { NextRequest } from 'next/server';
import {
  ADMIN_SUBDOMAIN,
  GIRIS_SUBDOMAIN,
  ORGANIZER_PANEL_SUBDOMAINS,
  SUPPORT_SUBDOMAIN,
  canonicalHost,
  resolveProductionRootHost
} from '@/lib/config/domain';

function collectExpectedOrigins(host: string): Set<string> {
  const expected = new Set<string>();
  const hostname = host.split(':')[0];
  const rootHost = resolveProductionRootHost() ?? canonicalHost.split(':')[0].replace(/^www\./, '');

  const platformSubs = [
    ...ORGANIZER_PANEL_SUBDOMAINS,
    SUPPORT_SUBDOMAIN,
    GIRIS_SUBDOMAIN,
    ADMIN_SUBDOMAIN
  ];

  for (const proto of ['https', 'http']) {
    expected.add(`${proto}://${host}`);
    if (hostname.startsWith('www.')) {
      expected.add(`${proto}://${hostname.slice(4)}`);
    } else {
      expected.add(`${proto}://www.${hostname}`);
    }

    for (const sub of platformSubs) {
      if (rootHost !== 'localhost') {
        expected.add(`${proto}://${sub}.${rootHost}`);
      } else {
        expected.add(`${proto}://${sub}.localhost`);
      }
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      const origin = new URL(siteUrl).origin;
      expected.add(origin);
      const siteHost = new URL(siteUrl).hostname;
      if (siteHost.startsWith('www.')) {
        expected.add(`${new URL(siteUrl).protocol}//${siteHost.slice(4)}`);
      } else {
        expected.add(`${new URL(siteUrl).protocol}//www.${siteHost}`);
      }
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
