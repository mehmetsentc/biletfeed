'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { isAuthPath, getPostLoginPath } from '@/lib/firebase/auth-redirect';

async function hasValidServerSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    return res.ok;
  } catch {
    return false;
  }
}

/** Oturum çerezi doğrulandıktan sonra güvenli yönlendirme. */
export function AuthSessionRedirect() {
  const { firebaseUser, loading, sessionReady } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthPath(pathname)) return;
    if (loading || !firebaseUser || !sessionReady) return;
    if (redirectedRef.current) return;

    redirectedRef.current = true;
    const target = getPostLoginPath(pathname, searchParams.toString());

    void hasValidServerSession().then((valid) => {
      if (valid) {
        window.location.replace(target);
      } else {
        redirectedRef.current = false;
      }
    });
  }, [firebaseUser, loading, sessionReady, pathname, searchParams]);

  return null;
}

export { getPostLoginPath as getRedirectTarget };
