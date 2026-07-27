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
 * Capacitor / Ionic WKWebView bazen Origin olarak capacitor://localhost,
 * ionic://localhost veya https://localhost gönderir.
 */
function isNativeShellOrigin(origin: string): boolean {
  if (origin === 'null') return true;
  try {
    const url = new URL(origin);
    if (url.protocol === 'capacitor:' || url.protocol === 'ionic:') return true;
    if (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function isTrustedPlatformHost(host: string): boolean {
  const hostname = host.split(':')[0]?.toLowerCase() ?? '';
  const root =
    resolveProductionRootHost() ??
    canonicalHost.split(':')[0].replace(/^www\./, '');
  return (
    hostname === root ||
    hostname === `www.${root}` ||
    hostname.endsWith(`.${root}`) ||
    hostname.endsWith('.localhost') ||
    hostname === 'localhost'
  );
}

/**
 * Tarayıcı kaynaklı POST/PATCH/DELETE için CSRF koruması.
 * Origin veya Referer zorunlu; ikisi de yoksa istek reddedilir.
 *
 * İstisna: modern tarayıcılar/WKWebView'lar `Sec-Fetch-Site` header'ını
 * (Fetch Metadata) gönderir — Origin eksikse buna güvenmek güvenlidir.
 * Capacitor native shell Origin'leri beklenen listede olmadığı için
 * hemen reddedilmez; Referer / Sec-Fetch-Site / güvenilir Host ile doğrulanır.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const host = request.headers.get('host');
  if (!host) return false;

  const expected = collectExpectedOrigins(host);
  const origin = request.headers.get('origin');
  if (origin && expected.has(origin)) {
    return true;
  }

  // Yabancı (non-native) Origin → reddet
  if (origin && !isNativeShellOrigin(origin)) {
    return false;
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      if (expected.has(new URL(referer).origin)) return true;
    } catch {
      /* ignore */
    }
  }

  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'same-origin' || secFetchSite === 'none') {
    return true;
  }

  // Origin yok veya native shell + Host bizim platformumuz
  if ((!origin || isNativeShellOrigin(origin)) && isTrustedPlatformHost(host)) {
    return true;
  }

  return false;
}
