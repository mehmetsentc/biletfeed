import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type UserCredential
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';
import { isCapacitor } from '@/lib/firebase/apple-auth';
import {
  consumeOAuthRedirectResult,
  resetRedirectResultCache as resetOAuthRedirectResultCache
} from '@/lib/firebase/oauth-redirect';

export { resetRedirectResultCache } from '@/lib/firebase/oauth-redirect';

export type GoogleSignInMode = 'popup' | 'redirect' | 'native';

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

/** Persistence'dan önce çağrılmalı — client.ts mount sırasında tetikler */
export function consumeGoogleRedirectResult(
  auth: Auth
): Promise<UserCredential | null> {
  return consumeOAuthRedirectResult(auth);
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
  // Capacitor'da redirect akışı kullanılmaz
  if (isCapacitor()) return null;

  const pending = wasGoogleRedirectPending();

  try {
    const result = await consumeGoogleRedirectResult(auth);

    if (result?.user) {
      clearGoogleRedirectPending();
      return null;
    }

    // Yalnızca gerçek redirect dönüşünde beklenen currentUser'ı başarı say
    if (pending && (await waitForAuthUser(auth))) {
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
 * Capacitor native Google Sign In — @capacitor-firebase/authentication
 * Google'ın native Sign-In SDK'sını kullanır. Firebase JS SDK'nın web
 * popup/redirect akışı Capacitor'ın WKWebView'ında Google tarafından
 * engellendiği (disallowed_useragent) için burada asla web akışına düşülmez.
 */
async function signInWithGoogleNative(auth: Auth): Promise<GoogleSignInResult> {
  const { FirebaseAuthentication } = await import(
    '@capacitor-firebase/authentication'
  );

  const result = await FirebaseAuthentication.signInWithGoogle();

  const idToken = result.credential?.idToken;
  if (!idToken) throw new Error('Google idToken alınamadı');

  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
  return { mode: 'native', completed: true };
}

/**
 * Ana giriş fonksiyonu:
 * - Capacitor (iOS/Android uygulama): native Google Sign-In — WKWebView'a hiç girmez
 * - Web: önce popup, engellenirse redirect
 */
export async function signInWithGoogle(auth: Auth): Promise<GoogleSignInResult> {
  // ── Capacitor: native Google Sign In ──────────────────────────────────────
  if (isCapacitor()) {
    return signInWithGoogleNative(auth);
  }

  // ── Web: popup → redirect fallback (COOP: same-origin-allow-popups) ───────
  const provider = createGoogleProvider();

  try {
    await signInWithPopup(auth, provider);
    return { mode: 'popup', completed: true };
  } catch (err) {
    const code = getAuthErrorCode(err);
    if (!POPUP_FALLBACK_CODES.has(code)) {
      throw err;
    }

    resetOAuthRedirectResultCache();
    markGoogleRedirectPending();
    await signInWithRedirect(auth, provider);
    return { mode: 'redirect', completed: false };
  }
}
