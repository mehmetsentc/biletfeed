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

async function forceSignOut(auth: Auth): Promise<null> {
  const { signOut } = await import('firebase/auth');
  await signOut(auth);
  return null;
}

/**
 * panel.biletfeed.com / admin. / ana site ayrı Firebase IndexedDB kullanır.
 * Çerez (.biletfeed.com) kaynak gerçektir: session VEYA panel_session → Firebase hizala.
 * Çerez yoksa Firebase sessizce yeni çerez üretemez (çapraz çıkış).
 */
export async function alignFirebaseWithSessionCookie(
  auth: Auth,
  firebaseUser: FirebaseUser | null
): Promise<FirebaseUser | null> {
  if (isExplicitLogoutActive() || isGlobalLogoutActive()) {
    if (firebaseUser) return forceSignOut(auth);
    return null;
  }

  const panelContext = isPanelAuthContext();
  const primary = panelContext
    ? await fetchPanelSessionUser()
    : await fetchSessionUser();
  const fallback = primary
    ? null
    : panelContext
      ? await fetchSessionUser()
      : await fetchPanelSessionUser();
  const sessionUser = primary ?? fallback;

  if (!sessionUser) {
    // Hiçbir SSO çerezi yok → bu origin'deki Firebase'i de kapat
    if (firebaseUser) return forceSignOut(auth);
    return null;
  }

  if (firebaseUser?.uid === sessionUser.uid) {
    return firebaseUser;
  }

  // Yeni OAuth kullanıcıyı çerezden eski uid'e zorlama
  if (firebaseUser) {
    return firebaseUser;
  }

  const tokenEndpoint = panelContext
    ? '/api/auth/panel-custom-token'
    : '/api/auth/custom-token';
  const synced = await signInWithSessionCustomToken(auth, tokenEndpoint);
  return synced ? auth.currentUser : null;
}
