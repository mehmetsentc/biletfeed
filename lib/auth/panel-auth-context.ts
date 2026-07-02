import { isOnOrganizerPanelHost } from '@/lib/config/domain';

/** İstemci: organizatör panel oturumu mu kullanılmalı? */
export function isPanelAuthContext(): boolean {
  if (typeof window === 'undefined') return false;
  if (isOnOrganizerPanelHost(window.location.hostname)) return true;
  return window.location.pathname.startsWith('/organizator-panel');
}
