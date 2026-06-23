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

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

let redirectResultPromise: Promise<UserCredential | null> | null = null;

export function resetRedirectResultCache() {
  redirectResultPromise = null;
}

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
  return sessionStorage.getItem(REDIRECT_PENDING_KEY) === '1';
}

export function clearGoogleRedirectPending() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(REDIRECT_PENDING_KEY);
}

export function markGoogleRedirectPending() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
}

function getAuthErrorCode(err: unknown): string {
  if (err instanceof FirebaseError) return err.code;
  return typeof err === 'object' && err && 'code' in err
    ? String((err as { code: string }).code)
    : '';
}

function shouldPreferRedirect(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    process.env.NODE_ENV === 'production' ||
    window.matchMedia('(pointer: coarse)').matches ||
    window.innerWidth < 768 ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  );
}

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request'
]);

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
    clearGoogleRedirectPending();

    if (result?.user) return null;

    if (pending && !auth.currentUser) {
      return 'Google oturumu tamamlanamadı. Lütfen tekrar deneyin.';
    }

    return null;
  } catch (err) {
    clearGoogleRedirectPending();
    return getFirebaseAuthErrorMessage(err, 'Google ile giriş başarısız oldu');
  }
}

/**
 * Production ve mobilde redirect; geliştirmede popup.
 * Popup hata verirse otomatik redirect'e düşer.
 */
export async function signInWithGoogle(auth: Auth): Promise<GoogleSignInResult> {
  if (auth.currentUser) {
    return { mode: 'popup', completed: true };
  }

  const provider = createGoogleProvider();

  if (shouldPreferRedirect()) {
    resetRedirectResultCache();
    markGoogleRedirectPending();
    await signInWithRedirect(auth, provider);
    return { mode: 'redirect', completed: false };
  }

  try {
    await signInWithPopup(auth, provider);
    return { mode: 'popup', completed: true };
  } catch (err) {
    const code = getAuthErrorCode(err);
    if (POPUP_FALLBACK_CODES.has(code)) {
      resetRedirectResultCache();
      markGoogleRedirectPending();
      await signInWithRedirect(auth, provider);
      return { mode: 'redirect', completed: false };
    }
    throw err;
  }
}
