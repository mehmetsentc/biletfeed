'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { sanitizeRedirectPath } from '@/lib/auth/safe-redirect';
import { isPanelAuthContext } from '@/lib/auth/panel-auth-context';

const PANEL_AUTH_PATHS = ['/organizator-panel/giris', '/giris'];

export function isPanelAuthPath(pathname: string): boolean {
  return PANEL_AUTH_PATHS.includes(pathname);
}

export function getPanelRedirectTarget(search: string): string {
  const params = new URLSearchParams(search);
  const fallback =
    typeof window !== 'undefined' && isPanelAuthContext()
      ? window.location.hostname.includes('panel.')
        ? '/baslangic'
        : '/organizator-panel/baslangic'
      : '/organizator-panel/baslangic';
  return sanitizeRedirectPath(params.get('redirect'), fallback);
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
