import {
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type UserCredential
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';
import {
  consumeOAuthRedirectResult,
  resetRedirectResultCache
} from '@/lib/firebase/oauth-redirect';

export type AppleSignInMode = 'popup' | 'redirect';

export type AppleSignInResult = {
  mode: AppleSignInMode;
  /** Popup akışında kullanıcı oturumu hemen hazır */
  completed: boolean;
};

const REDIRECT_PENDING_KEY = 'bf_apple_redirect_pending';
const REDIRECT_PENDING_AT_KEY = 'bf_apple_redirect_pending_at';
const REDIRECT_PENDING_TTL_MS = 5 * 60 * 1000;

function createAppleProvider() {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  return provider;
}

export function resetAppleRedirectResultCache() {
  resetRedirectResultCache();
}

/** Persistence'dan önce çağrılmalı — AuthProvider mount sırasında tetikler */
export function consumeAppleRedirectResult(
  auth: Auth
): Promise<UserCredential | null> {
  return consumeOAuthRedirectResult(auth);
}

export function wasAppleRedirectPending(): boolean {
  if (typeof window === 'undefined') return false;

  if (localStorage.getItem(REDIRECT_PENDING_KEY) === '1') return true;

  const startedAt = Number(localStorage.getItem(REDIRECT_PENDING_AT_KEY) || 0);
  return startedAt > 0 && Date.now() - startedAt < REDIRECT_PENDING_TTL_MS;
}

export function clearAppleRedirectPending() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REDIRECT_PENDING_KEY);
  localStorage.removeItem(REDIRECT_PENDING_AT_KEY);
}

export function markAppleRedirectPending() {
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
 * Apple redirect dönüşünü işler. AuthProvider mount sırasında, onAuthStateChanged
 * öncesinde çağrılmalıdır.
 */
export async function finishAppleRedirectSignIn(
  auth: Auth
): Promise<string | null> {
  const pending = wasAppleRedirectPending();

  try {
    const result = await consumeAppleRedirectResult(auth);

    if (result?.user) {
      clearAppleRedirectPending();
      return null;
    }

    if (await waitForAuthUser(auth)) {
      clearAppleRedirectPending();
      return null;
    }

    if (pending) {
      clearAppleRedirectPending();
      return 'Apple oturumu tamamlanamadı. Tarayıcı çerezlerini kontrol edip tekrar deneyin veya e-posta ile giriş yapın.';
    }

    return null;
  } catch (err) {
    clearAppleRedirectPending();
    return getFirebaseAuthErrorMessage(err, 'Apple ile giriş başarısız oldu', 'apple');
  }
}

/**
 * Önce popup dener (COOP: same-origin-allow-popups). Popup engellenirse redirect'e düşer.
 */
export async function signInWithApple(auth: Auth): Promise<AppleSignInResult> {
  if (auth.currentUser) {
    return { mode: 'popup', completed: true };
  }

  const provider = createAppleProvider();

  try {
    await signInWithPopup(auth, provider);
    return { mode: 'popup', completed: true };
  } catch (err) {
    const code = getAuthErrorCode(err);
    if (!POPUP_FALLBACK_CODES.has(code)) {
      throw err;
    }

    resetAppleRedirectResultCache();
    markAppleRedirectPending();
    await signInWithRedirect(auth, provider);
    return { mode: 'redirect', completed: false };
  }
}
