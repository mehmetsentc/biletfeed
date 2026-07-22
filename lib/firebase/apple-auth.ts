import {
  OAuthProvider,
  signInWithCredential,
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

export type AppleSignInMode = 'popup' | 'redirect' | 'native';

export type AppleSignInResult = {
  mode: AppleSignInMode;
  /** Popup / native akışında kullanıcı oturumu hemen hazır */
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

/** Capacitor ortamında mı çalışıyor? */
export function isCapacitor(): boolean {
  return typeof window !== 'undefined' &&
    !!(window as unknown as Record<string, unknown>)['Capacitor'];
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
      if (auth.currentUser) { resolve(true); return; }
      if (Date.now() - started >= ms) { resolve(false); return; }
      window.setTimeout(tick, 100);
    };
    tick();
  });
}

/**
 * Capacitor native Apple Sign In — @capacitor-firebase/authentication
 * Apple'ın ASAuthorizationAppleIDRequest API'sını (Firebase iOS SDK üzerinden) kullanır.
 * Tarayıcı AÇILMAZ — App Store Guideline 4 ile uyumlu.
 *
 * Not: skipNativeAuth: true kullanılıyor çünkü bu kombinasyon (Firebase JS SDK'nın
 * kendi oturumuna geçmek) Apple Sign-In'de yalnızca bu şekilde güvenilir çalışıyor
 * (bkz. capacitor-firebase paketi "Quirks" notu).
 */
async function signInWithAppleNative(auth: Auth): Promise<AppleSignInResult> {
  // Dynamic import — web build'de ayrı bir chunk'a alınır, native olmayan
  // ortamlarda hiç çalıştırılmaz.
  const { FirebaseAuthentication } = await import(
    '@capacitor-firebase/authentication'
  );

  const result = await FirebaseAuthentication.signInWithApple({
    skipNativeAuth: true
  });

  const idToken = result.credential?.idToken;
  const rawNonce = result.credential?.nonce;
  if (!idToken) throw new Error('Apple idToken alınamadı');

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken, rawNonce });
  await signInWithCredential(auth, credential);
  return { mode: 'native', completed: true };
}

/**
 * Apple redirect dönüşünü işler. AuthProvider mount sırasında, onAuthStateChanged
 * öncesinde çağrılmalıdır. (Yalnızca web akışı için geçerli)
 */
export async function finishAppleRedirectSignIn(
  auth: Auth
): Promise<string | null> {
  // Capacitor'da redirect akışı kullanılmaz
  if (isCapacitor()) return null;

  const pending = wasAppleRedirectPending();

  try {
    const result = await consumeAppleRedirectResult(auth);

    if (result?.user) { clearAppleRedirectPending(); return null; }

    if (pending && (await waitForAuthUser(auth))) {
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
 * Ana giriş fonksiyonu:
 * - Capacitor (iOS uygulama): native ASAuthorizationAppleIDRequest — tarayıcı açmaz
 * - Web: önce popup, engellenirse redirect
 */
export async function signInWithApple(auth: Auth): Promise<AppleSignInResult> {
  // ── Capacitor: native Sign In with Apple ──────────────────────────────────
  if (isCapacitor()) {
    return signInWithAppleNative(auth);
  }

  // ── Web: popup → redirect fallback (hesap değiştirmede currentUser'ı atlama) ─
  const provider = createAppleProvider();

  try {
    await signInWithPopup(auth, provider);
    return { mode: 'popup', completed: true };
  } catch (err) {
    const code = getAuthErrorCode(err);
    if (!POPUP_FALLBACK_CODES.has(code)) throw err;

    resetAppleRedirectResultCache();
    markAppleRedirectPending();
    await signInWithRedirect(auth, provider);
    return { mode: 'redirect', completed: false };
  }
}
