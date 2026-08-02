'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { sanitizeRedirectPath } from '@/lib/auth/safe-redirect';
import { isPanelAuthContext } from '@/lib/auth/panel-auth-context';
import { toPanelPublicPath } from '@/lib/auth/panel-paths';
import { isOnOrganizerPanelHost } from '@/lib/config/domain';

const PANEL_AUTH_PATHS = ['/organizator-panel/giris', '/giris'];

export function isPanelAuthPath(pathname: string): boolean {
  return PANEL_AUTH_PATHS.includes(pathname);
}

export function getPanelRedirectTarget(search: string): string {
  const params = new URLSearchParams(search);
  const onPanelHost =
    typeof window !== 'undefined' &&
    (isOnOrganizerPanelHost(window.location.hostname) || isPanelAuthContext());
  const fallback = onPanelHost ? '/baslangic' : '/organizator-panel/baslangic';
  const raw = sanitizeRedirectPath(params.get('redirect'), fallback);
  // panel.biletfeed.com üzerinde /organizator-panel/* → temiz path
  if (onPanelHost && raw.startsWith('/')) {
    return toPanelPublicPath(raw);
  }
  return raw;
}

async function hasValidPanelSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/panel-me', { credentials: 'same-origin' });
    return res.ok;
  } catch {
    return false;
  }
}

/** Panel giriş sayfasında oturum hazır olunca yönlendir */
export function PanelAuthRedirect() {
  const { firebaseUser, loading, sessionReady } = useAuth();
  const searchParams = useSearchParams();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isPanelAuthPath(window.location.pathname)) return;
    if (loading || !firebaseUser || !sessionReady) return;
    if (redirectedRef.current) return;

    redirectedRef.current = true;
    const target = getPanelRedirectTarget(searchParams.toString());

    void hasValidPanelSession().then((valid) => {
      if (valid) {
        window.location.replace(target);
      } else {
        redirectedRef.current = false;
      }
    });
  }, [firebaseUser, loading, sessionReady, searchParams]);

  return null;
}
