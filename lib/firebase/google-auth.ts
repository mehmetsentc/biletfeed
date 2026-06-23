import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type Auth,
  type UserCredential
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';

export type GoogleSignInMode = 'popup' | 'redirect';

export type GoogleSignInResult = {
  mode: GoogleSignInMode;
  /** Popup akışında kullanıcı oturumu hemen hazır */
  completed: boolean;
};

const REDIRECT_PENDING_KEY = 'bf_google_redirect_pending';
const REDIRECT_PENDING_AT_KEY = 'bf_google_redirect_pending_at';
const REDIRECT_PENDING_TTL_MS = 5 * 60 * 1000;

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

let redirectResultPromise: Promise<UserCredential | null> | null = null;

export function resetRedirectResultCache() {
  redirectResultPromise = null;
}

/** Persistence'dan önce çağrılmalı — client.ts mount sırasında tetikler */
export function consumeGoogleRedirectResult(
  auth: Auth
): Promise<UserCredential | null> {
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth);
  }
  return redirectResultPromise;
}

export function wasGoogleRedirectPending(): boolean {
  if (typeof window === 'undefined') return false;

  if (localStorage.getItem(REDIRECT_PENDING_KEY) === '1') return true;

  const startedAt = Number(localStorage.getItem(REDIRECT_PENDING_AT_KEY) || 0);
  return startedAt > 0 && Date.now() - startedAt < REDIRECT_PENDING_TTL_MS;
}

export function clearGoogleRedirectPending() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REDIRECT_PENDING_KEY);
  localStorage.removeItem(REDIRECT_PENDING_AT_KEY);
}

export function markGoogleRedirectPending() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REDIRECT_PENDING_KEY, '1');
  localStorage.setItem(REDIRECT_PENDING_AT_KEY, String(Date.now()));
}

function getAuthErrorCode(err: unknown): string {
  if (err instanceof FirebaseError) return err.code;
  return typeof err === 'object' && err && 'code' in err
    ? String((err as { code: string }).code)
    : '';
}

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request'
]);

async function waitForAuthUser(auth: Auth, ms = 1200): Promise<boolean> {
  if (auth.currentUser) return true;

  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (auth.currentUser) {
        resolve(true);
        return;
      }
      if (Date.now() - started >= ms) {
        resolve(false);
        return;
      }
      window.setTimeout(tick, 100);
    };
    tick();
  });
}

/**
 * Google redirect dönüşünü işler. AuthProvider mount sırasında, onAuthStateChanged
 * öncesinde çağrılmalıdır.
 */
export async function finishGoogleRedirectSignIn(
  auth: Auth
): Promise<string | null> {
  const pending = wasGoogleRedirectPending();

  try {
    const result = await consumeGoogleRedirectResult(auth);

    if (result?.user) {
      clearGoogleRedirectPending();
      return null;
    }

    if (await waitForAuthUser(auth)) {
      clearGoogleRedirectPending();
      return null;
    }

    if (pending) {
      clearGoogleRedirectPending();
      return 'Google oturumu tamamlanamadı. Tarayıcı çerezlerini kontrol edip tekrar deneyin veya e-posta ile giriş yapın.';
    }

    return null;
  } catch (err) {
    clearGoogleRedirectPending();
    return getFirebaseAuthErrorMessage(err, 'Google ile giriş başarısız oldu');
  }
}

/**
 * Önce popup dener (COOP: same-origin-allow-popups). Popup engellenirse redirect'e düşer.
 */
export async function signInWithGoogle(auth: Auth): Promise<GoogleSignInResult> {
  if (auth.currentUser) {
    return { mode: 'popup', completed: true };
  }

  const provider = createGoogleProvider();

  try {
    await signInWithPopup(auth, provider);
    return { mode: 'popup', completed: true };
  } catch (err) {
    const code = getAuthErrorCode(err);
    if (!POPUP_FALLBACK_CODES.has(code)) {
      throw err;
    }

    resetRedirectResultCache();
    markGoogleRedirectPending();
    await signInWithRedirect(auth, provider);
    return { mode: 'redirect', completed: false };
  }
}
