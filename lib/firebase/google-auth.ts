import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type Auth,
  type UserCredential
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

export type GoogleSignInMode = 'popup' | 'redirect';

export type GoogleSignInResult = {
  mode: GoogleSignInMode;
  /** Popup akışında kullanıcı oturumu hemen hazır */
  completed: boolean;
};

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

let redirectResultPromise: Promise<UserCredential | null> | null = null;

export function consumeGoogleRedirectResult(
  auth: Auth
): Promise<UserCredential | null> {
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth);
  }
  return redirectResultPromise;
}

function getAuthErrorCode(err: unknown): string {
  if (err instanceof FirebaseError) return err.code;
  return typeof err === 'object' && err && 'code' in err
    ? String((err as { code: string }).code)
    : '';
}

function shouldPreferRedirect(): boolean {
  if (typeof window === 'undefined') return false;

  if (process.env.NODE_ENV === 'production') return true;

  return (
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
 * Production ve mobilde redirect; geliştirmede popup.
 * Popup hata verirse otomatik redirect'e düşer.
 */
export async function signInWithGoogle(auth: Auth): Promise<GoogleSignInResult> {
  if (auth.currentUser) {
    return { mode: 'popup', completed: true };
  }

  const provider = createGoogleProvider();

  if (shouldPreferRedirect()) {
    await signInWithRedirect(auth, provider);
    return { mode: 'redirect', completed: false };
  }

  try {
    await signInWithPopup(auth, provider);
    return { mode: 'popup', completed: true };
  } catch (err) {
    const code = getAuthErrorCode(err);
    if (POPUP_FALLBACK_CODES.has(code)) {
      await signInWithRedirect(auth, provider);
      return { mode: 'redirect', completed: false };
    }
    throw err;
  }
}
