'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import {
  isAuthPath,
  getPostLoginPath,
  redirectFromAuthPagesIfNeeded
} from '@/lib/firebase/auth-redirect';

/** Yedek yönlendirme — auth state hazır olunca tetiklenir. */
export function AuthSessionRedirect() {
  const { user, firebaseUser, loading } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const triedRef = useRef(false);

  useEffect(() => {
    if (!isAuthPath(pathname)) return;
    if (loading) return;
    if (!user && !firebaseUser) return;
    if (triedRef.current) return;

    triedRef.current = true;
    const target = getPostLoginPath(pathname, searchParams.toString());
    window.location.replace(target);
  }, [user, firebaseUser, loading, pathname, searchParams]);

  useEffect(() => {
    if (!loading && (user || firebaseUser) && isAuthPath(pathname)) {
      redirectFromAuthPagesIfNeeded();
    }
  }, [user, firebaseUser, loading, pathname]);

  return null;
}

export { getPostLoginPath as getRedirectTarget };
