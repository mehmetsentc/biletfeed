import { signInWithCustomToken, type Auth, type User as FirebaseUser } from 'firebase/auth';
import { fetchSessionUser } from '@/lib/auth/session-profile';

export async function signInWithSessionCustomToken(
  auth: Auth
): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/custom-token', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { token?: string };
    if (!data.token) return false;
    await signInWithCustomToken(auth, data.token);
    return true;
  } catch {
    return false;
  }
}

/**
 * panel.biletfeed.com ve biletfeed.com ayrı Firebase persistence kullanır.
 * Paylaşılan session çerezi ile bu origin'deki Firebase kullanıcısını hizalar.
 */
export async function alignFirebaseWithSessionCookie(
  auth: Auth,
  firebaseUser: FirebaseUser | null
): Promise<FirebaseUser | null> {
  const sessionUser = await fetchSessionUser();

  if (!sessionUser) {
    return firebaseUser;
  }

  if (firebaseUser?.uid === sessionUser.uid) {
    return firebaseUser;
  }

  if (firebaseUser) {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  }

  const synced = await signInWithSessionCustomToken(auth);
  return synced ? auth.currentUser : null;
}
