'use client';

import { useEffect } from 'react';
import { resetAuthRedirectGuard } from '@/lib/firebase/auth-redirect';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';

const GOOGLE_AUTH_ERROR_KEY = 'bf_google_auth_error';

export function readStoredGoogleAuthError(): string | null {
  if (typeof window === 'undefined') return null;
  const message = sessionStorage.getItem(GOOGLE_AUTH_ERROR_KEY);
  if (message) sessionStorage.removeItem(GOOGLE_AUTH_ERROR_KEY);
  return message;
}

export function storeGoogleAuthError(message: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(GOOGLE_AUTH_ERROR_KEY, message);
}

/** Auth layout: yönlendirme guard'ını sıfırlar. Asıl Google akışı AuthProvider'da. */
export function GoogleAuthInit() {
  useEffect(() => {
    resetAuthRedirectGuard();
  }, []);

  return null;
}

export function getGoogleAuthErrorMessage(err: unknown): string {
  return getFirebaseAuthErrorMessage(err, 'Google ile giriş başarısız oldu');
}
