import { signInWithCustomToken, type Auth, type User as FirebaseUser } from 'firebase/auth';
import { isPanelAuthContext } from '@/lib/auth/panel-auth-context';
import { isExplicitLogoutActive } from '@/lib/auth/logout-cleanup';
import { isGlobalLogoutActive } from '@/lib/auth/global-logout';
import {
  fetchPanelSessionUser,
  fetchSessionUser
} from '@/lib/auth/session-profile';

const CUSTOM_TOKEN_COOLDOWN_MS = 15_000;
let lastCustomTokenAttemptAt = 0;

async function signInWithSessionCustomToken(
  auth: Auth,
  endpoint: '/api/auth/custom-token' | '/api/auth/panel-custom-token'
): Promise<boolean> {
  const now = Date.now();
  if (now - lastCustomTokenAttemptAt < CUSTOM_TOKEN_COOLDOWN_MS) {
    return false;
  }
  lastCustomTokenAttemptAt = now;

  try {
    const res = await fetch(endpoint, {
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
 * İlgili oturum çerezi ile bu origin'deki Firebase kullanıcısını hizalar.
 */
export async function alignFirebaseWithSessionCookie(
  auth: Auth,
  firebaseUser: FirebaseUser | null
): Promise<FirebaseUser | null> {
  if (isExplicitLogoutActive() || isGlobalLogoutActive()) {
    if (firebaseUser) {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    }
    return null;
  }

  const panelContext = isPanelAuthContext();
  const sessionUser = panelContext
    ? await fetchPanelSessionUser()
    : await fetchSessionUser();

  if (!sessionUser) {
    // Çerez yok ama Firebase hâlâ doluysa (başka alt alandan çıkış) → oturumu kapat
    if (firebaseUser && isGlobalLogoutActive()) {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      return null;
    }
    return firebaseUser;
  }

  if (firebaseUser?.uid === sessionUser.uid) {
    return firebaseUser;
  }

  // Canlı Firebase kullanıcısı varsa (yeni Google/Apple seçimi) eski çereze zorlama.
  // handleSignedInUser yeni panel_session / session yazar.
  if (firebaseUser) {
    return firebaseUser;
  }

  const tokenEndpoint = panelContext
    ? '/api/auth/panel-custom-token'
    : '/api/auth/custom-token';
  const synced = await signInWithSessionCustomToken(auth, tokenEndpoint);
  return synced ? auth.currentUser : null;
}
