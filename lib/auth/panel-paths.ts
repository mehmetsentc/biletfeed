import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isOnOrganizerPanelHost } from '@/lib/config/domain';

/**
 * Panel alt alanı (panel.biletfeed.com) temiz path kullanır.
 * `/organizator-panel/...` prefix'i ana sitede / dev'de geçerli; panel host'ta
 * middleware rewrite zaten ekler — redirect'te tekrar eklenirse yenileme döngüsü oluşur.
 */
export function toPanelPublicPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) return trimmed;

  if (trimmed === '/organizator-panel' || trimmed === '/organizator-panel/') {
    return '/baslangic';
  }

  if (trimmed.startsWith('/organizator-panel/')) {
    const stripped = trimmed.slice('/organizator-panel'.length) || '/baslangic';
    return stripped.startsWith('/') ? stripped : `/${stripped}`;
  }

  return trimmed;
}

/** App Router route path — her zaman /organizator-panel altında */
export function toOrganizatorPanelRoute(path: string): string {
  const clean = toPanelPublicPath(path);
  if (clean.startsWith('/organizator-panel')) return clean;
  return `/organizator-panel${clean === '/' ? '/baslangic' : clean}`;
}

/**
 * Server redirect hedefi:
 * - panel.biletfeed.com → /baslangic, /giris (temiz)
 * - ana site / localhost → /organizator-panel/baslangic
 */
export function panelServerPath(path: string, hostHeader: string | null): string {
  const hostname = (hostHeader ?? '').split(':')[0] ?? '';
  const onPanel =
    isOnOrganizerPanelHost(hostname) ||
    hostname.startsWith('panel.') ||
    hostname.startsWith('organizer.');
  const clean = toPanelPublicPath(path);
  if (onPanel) return clean;
  return toOrganizatorPanelRoute(clean);
}

export function panelServerLoginPath(
  hostHeader: string | null,
  redirectTo = '/baslangic'
): string {
  const login = panelServerPath('/giris', hostHeader);
  const redirectTarget = panelServerPath(redirectTo, hostHeader);
  // panel host'ta redirect=/baslangic; ana sitede /organizator-panel/baslangic
  const q = new URLSearchParams({ redirect: redirectTarget });
  return `${login}?${q.toString()}`;
}

/** Server Component redirect — host'a göre temiz veya /organizator-panel path */
export async function redirectToPanel(path: string): Promise<never> {
  const host = (await headers()).get('host');
  redirect(panelServerPath(path, host));
}

/** Giriş sayfasına host-aware redirect */
export async function redirectToPanelLogin(
  redirectTo = '/baslangic'
): Promise<never> {
  const host = (await headers()).get('host');
  redirect(panelServerLoginPath(host, redirectTo));
}
