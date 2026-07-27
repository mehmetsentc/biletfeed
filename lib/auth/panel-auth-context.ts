import { isOnGirisHost, isOnOrganizerPanelHost } from '@/lib/config/domain';

/** İstemci: organizatör panel oturumu mu kullanılmalı? */
export function isPanelAuthContext(): boolean {
  if (typeof window === 'undefined') return false;
  if (isOnOrganizerPanelHost(window.location.hostname)) return true;
  return window.location.pathname.startsWith('/organizator-panel');
}

/**
 * Kapı terminali (giris.biletfeed.com / /giris-terminal) —
 * panel_session + kapı kodu ile çalışır; ana site AuthProvider
 * oturum kurma/silme akışı bu oturumu bozmamalı.
 */
export function isGateAuthContext(): boolean {
  if (typeof window === 'undefined') return false;
  if (isOnGirisHost(window.location.hostname)) return true;
  return window.location.pathname.startsWith('/giris-terminal');
}
