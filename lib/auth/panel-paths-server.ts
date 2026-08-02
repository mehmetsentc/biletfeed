import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  panelServerLoginPath,
  panelServerPath
} from '@/lib/auth/panel-paths';

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
