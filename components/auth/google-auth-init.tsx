'use client';

import { useEffect } from 'react';
import {
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  ensureAuthReady
} from '@/lib/firebase/client';
import { consumeGoogleRedirectResult } from '@/lib/firebase/google-auth';
import { establishClientSessionWithRetry } from '@/lib/auth/client-session';
import { isAuthPath, resetAuthRedirectGuard } from '@/lib/firebase/auth-redirect';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';

const GOOGLE_AUTH_ERROR_KEY = 'bf_google_auth_error';

export function readStoredGoogleAuthError(): string | null {
  if (typeof window === 'undefined') return null;
  const message = sessionStorage.getItem(GOOGLE_AUTH_ERROR_KEY);
  if (message) sessionStorage.removeItem(GOOGLE_AUTH_ERROR_KEY);
  return message;
}

function storeGoogleAuthError(message: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(GOOGLE_AUTH_ERROR_KEY, message);
}

async function ensureSessionForGoogleUser(user: FirebaseUser) {
  try {
    await establishClientSessionWithRetry(user);
  } catch {
    // AuthProvider yeniden dener; yönlendirme sessionReady sonrası yapılır
  }
}

/**
 * Google redirect/popup sonrası oturum çerezini kurar.
 * Yönlendirme AuthSessionRedirect tarafından sessionReady sonrası yapılır.
 */
export function GoogleAuthInit() {
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    resetAuthRedirectGuard();
    let active = true;

    void ensureAuthReady().then(async (auth) => {
      try {
        const result = await consumeGoogleRedirectResult(auth);
        if (active && result?.user) {
          await ensureSessionForGoogleUser(result.user);
        }
      } catch (err) {
        console.error('[GoogleAuthInit]', err);
        if (active && isAuthPath(window.location.pathname)) {
          storeGoogleAuthError(
            getFirebaseAuthErrorMessage(err, 'Google ile giriş başarısız oldu')
          );
        }
      }

      if (active && auth.currentUser && isAuthPath(window.location.pathname)) {
        await ensureSessionForGoogleUser(auth.currentUser);
      }
    });

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || !isAuthPath(window.location.pathname)) return;
      void ensureSessionForGoogleUser(user);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return null;
}

export function getGoogleAuthErrorMessage(err: unknown): string {
  return getFirebaseAuthErrorMessage(err, 'Google ile giriş başarısız oldu');
}
