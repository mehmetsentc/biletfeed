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
import {
  redirectFromAuthPagesIfNeeded,
  isAuthPath,
  resetAuthRedirectGuard
} from '@/lib/firebase/auth-redirect';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';

async function onGoogleSignedIn(user: FirebaseUser) {
  // Session cookie ÖNCE kurulmalı; yönlendirme sonra.
  // Aksi hâlde protected sayfaya session'sız gidilir → middleware /giris'e atar → döngü.
  try {
    await establishClientSessionWithRetry(user);
  } catch {
    // Session kurulamazsa da yönlendir; kullanıcı /giris'te tekrar dener
  }
  redirectFromAuthPagesIfNeeded();
}

/**
 * Google redirect/popup sonrası oturum + yönlendirme.
 * Auth layout'ta bir kez mount edilir.
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
          await onGoogleSignedIn(result.user);
        }
      } catch (err) {
        console.error('[GoogleAuthInit]', err);
      }

      if (active && auth.currentUser && isAuthPath(window.location.pathname)) {
        await onGoogleSignedIn(auth.currentUser);
      }
    });

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || !isAuthPath(window.location.pathname)) return;
      void onGoogleSignedIn(user);
    });

    const poll = window.setInterval(() => {
      const current = getFirebaseAuth().currentUser;
      if (current && isAuthPath(window.location.pathname)) {
        void onGoogleSignedIn(current);
        window.clearInterval(poll);
      }
    }, 400);

    const pollTimeout = window.setTimeout(() => window.clearInterval(poll), 8000);

    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(poll);
      window.clearTimeout(pollTimeout);
    };
  }, []);

  return null;
}

export function getGoogleAuthErrorMessage(err: unknown): string {
  return getFirebaseAuthErrorMessage(err, 'Google ile giriş başarısız oldu');
}
