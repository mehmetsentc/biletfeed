import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type Auth,
  type UserCredential
} from 'firebase/auth';

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

function isPopupBlockedError(err: unknown): boolean {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: string }).code)
      : '';
  return code === 'auth/popup-blocked';
}

/** Popup öncelikli — zaten oturum varsa tekrar Google akışına girme. */
export async function signInWithGoogle(auth: Auth): Promise<void> {
  if (auth.currentUser) {
    return;
  }

  const provider = createGoogleProvider();

  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    if (isPopupBlockedError(err)) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw err;
  }
}
