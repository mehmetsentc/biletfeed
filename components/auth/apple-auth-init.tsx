'use client';

import { useEffect } from 'react';
import { resetAuthRedirectGuard } from '@/lib/firebase/auth-redirect';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';

const APPLE_AUTH_ERROR_KEY = 'bf_apple_auth_error';

export function readStoredAppleAuthError(): string | null {
  if (typeof window === 'undefined') return null;
  const message = sessionStorage.getItem(APPLE_AUTH_ERROR_KEY);
  if (message) sessionStorage.removeItem(APPLE_AUTH_ERROR_KEY);
  return message;
}

export function storeAppleAuthError(message: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(APPLE_AUTH_ERROR_KEY, message);
}

/** Auth layout: yönlendirme guard'ını sıfırlar. Asıl Apple akışı AuthProvider'da. */
export function AppleAuthInit() {
  useEffect(() => {
    resetAuthRedirectGuard();
  }, []);

  return null;
}

export function getAppleAuthErrorMessage(err: unknown): string {
  return getFirebaseAuthErrorMessage(err, 'Apple ile giriş başarısız oldu', 'apple');
}
