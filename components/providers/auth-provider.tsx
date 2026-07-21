'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  ensureAuthReady
} from '@/lib/firebase/client';
import {
  establishClientSessionWithRetry,
  establishPanelClientSessionWithRetry,
  SessionEstablishError
} from '@/lib/auth/client-session';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';
import { clearAuthTransientStorage, clearExplicitLogoutMark, isExplicitLogoutActive, markExplicitLogout } from '@/lib/auth/logout-cleanup';
import {
  clearGlobalLogoutMarker,
  isGlobalLogoutActive,
  markGlobalLogout
} from '@/lib/auth/global-logout';
import { clearAllServerSessions } from '@/lib/auth/clear-server-sessions';
import { alignFirebaseWithSessionCookie } from '@/lib/auth/firebase-session-sync';
import { isPanelAuthContext } from '@/lib/auth/panel-auth-context';
import {
  fetchPanelSessionUser,
  fetchSessionUser
} from '@/lib/auth/session-profile';
import { panelLoginHref } from '@/lib/config/domain';
import type { User } from '@/types';
import { ROLES } from '@/lib/auth/roles';

interface AuthContextValue {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  sessionReady: boolean;
  sessionError: string | null;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<import('@/lib/firebase/google-auth').GoogleSignInResult>;
  signInWithApple: () => Promise<import('@/lib/firebase/apple-auth').AppleSignInResult>;
  signOut: () => Promise<void>;
  signOutPanel: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  syncSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchUserProfile(
  firebaseUser: FirebaseUser,
  endpoint = '/api/auth/me'
): Promise<User> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(endpoint, {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.user.uid === firebaseUser.uid) {
          return data.user;
        }
      }
    } catch {
      // retry
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
  }

  return buildFallbackUser(firebaseUser);
}

function buildFallbackUser(firebaseUser: FirebaseUser): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || undefined,
    role: ROLES.USER,
    favorites: [],
    following: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function handleSignedInUser(
  fbUser: FirebaseUser,
  opts?: { isSigningOut?: () => boolean }
): Promise<{ profile: User; sessionReady: boolean; sessionError?: string }> {
  if (opts?.isSigningOut?.() || isExplicitLogoutActive() || isGlobalLogoutActive()) {
    return { profile: buildFallbackUser(fbUser), sessionReady: false };
  }

  const panelContext = isPanelAuthContext();
  const sessionEndpoint = panelContext
    ? '/api/auth/panel-session'
    : '/api/auth/session';
  const profileEndpoint = panelContext ? '/api/auth/panel-me' : '/api/auth/me';
  const establishSession = panelContext
    ? establishPanelClientSessionWithRetry
    : establishClientSessionWithRetry;

  const existingSession = panelContext
    ? await fetchPanelSessionUser()
    : await fetchSessionUser();
  if (existingSession?.uid === fbUser.uid) {
    const profile = await fetchUserProfile(fbUser, profileEndpoint);
    clearExplicitLogoutMark();
    clearGlobalLogoutMarker();
    return { profile, sessionReady: true };
  }

  try {
    if (opts?.isSigningOut?.()) {
      return { profile: buildFallbackUser(fbUser), sessionReady: false };
    }
    await establishSession(fbUser);
    if (opts?.isSigningOut?.()) {
      return { profile: buildFallbackUser(fbUser), sessionReady: false };
    }
    const profile = await fetchUserProfile(fbUser, profileEndpoint);
    clearExplicitLogoutMark();
    clearGlobalLogoutMarker();
    return { profile, sessionReady: true };
  } catch (err) {
    const isRateLimited =
      err instanceof SessionEstablishError && err.code === 'rate_limited';

    if (!isRateLimited) {
      try {
        await fetch(sessionEndpoint, { method: 'DELETE', credentials: 'same-origin' });
      } catch {
        // ignore
      }
    }

    const sessionError =
      err instanceof SessionEstablishError
        ? err.code === 'firebase_admin_missing'
          ? 'Sunucuda Firebase Admin yapılandırması eksik. Vercel ortam değişkenlerini kontrol edin.'
          : err.message
        : 'Oturum oluşturulamadı';
    return { profile: buildFallbackUser(fbUser), sessionReady: false, sessionError };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const isConfigured = isFirebaseConfigured();
  const authGenerationRef = useRef(0);
  const signingOutRef = useRef(false);

  const isStaleAuth = useCallback(
    (generation: number, uid: string, currentUid: string | undefined) =>
      authGenerationRef.current !== generation || currentUid !== uid,
    []
  );

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const auth = getFirebaseAuth();
    void Promise.all([
      import('@/lib/firebase/google-auth'),
      import('@/lib/firebase/apple-auth'),
      import('@/lib/firebase/oauth-redirect')
    ]).then(async ([googleAuth, appleAuth, oauthRedirect]) => {
      oauthRedirect.consumeOAuthRedirectResult(auth);
      try {
        const [googleError, appleError] = await Promise.all([
          googleAuth.finishGoogleRedirectSignIn(auth),
          appleAuth.finishAppleRedirectSignIn(auth)
        ]);
        const redirectError = googleError ?? appleError;
        if (!cancelled && redirectError) {
          setSessionError(redirectError);
          if (googleError) {
            const { storeGoogleAuthError } = await import(
              '@/components/auth/google-auth-init'
            );
            storeGoogleAuthError(googleError);
          }
          if (appleError) {
            const { storeAppleAuthError } = await import(
              '@/components/auth/apple-auth-init'
            );
            storeAppleAuthError(appleError);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setSessionError(
            getFirebaseAuthErrorMessage(err, 'Sosyal giriş başarısız oldu')
          );
        }
      }
    });

    void ensureAuthReady().then((readyAuth) => {
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(readyAuth, (fbUser) => {
        void (async () => {
          if (signingOutRef.current) {
            if (!fbUser) {
              authGenerationRef.current += 1;
              setFirebaseUser(null);
              setUser(null);
              setSessionReady(false);
              setSessionError(null);
              setLoading(false);
            }
            return;
          }

          if (isExplicitLogoutActive() || isGlobalLogoutActive()) {
            if (fbUser) {
              try {
                await firebaseSignOut(readyAuth);
              } catch {
                // ignore
              }
            }
            await clearAllServerSessions();
            authGenerationRef.current += 1;
            setFirebaseUser(null);
            setUser(null);
            setSessionReady(false);
            setSessionError(null);
            setLoading(false);
            return;
          }

          const alignedUser = await alignFirebaseWithSessionCookie(
            readyAuth,
            fbUser
          );

          if (signingOutRef.current) {
            if (!readyAuth.currentUser) {
              authGenerationRef.current += 1;
              setFirebaseUser(null);
              setUser(null);
              setSessionReady(false);
              setSessionError(null);
              setLoading(false);
            }
            return;
          }

          if (alignedUser && fbUser && alignedUser.uid !== fbUser.uid) {
            return;
          }

          const activeUser = alignedUser ?? fbUser;
          const panelContext = isPanelAuthContext();
          const sessionUser = panelContext
            ? await fetchPanelSessionUser()
            : await fetchSessionUser();

          if (signingOutRef.current) {
            if (!readyAuth.currentUser) {
              authGenerationRef.current += 1;
              setFirebaseUser(null);
              setUser(null);
              setSessionReady(false);
              setSessionError(null);
              setLoading(false);
            }
            return;
          }

          if (!activeUser && sessionUser) {
            if (isExplicitLogoutActive()) {
              await clearAllServerSessions();
              authGenerationRef.current += 1;
              setFirebaseUser(null);
              setUser(null);
              setSessionReady(false);
              setSessionError(null);
              setLoading(false);
              return;
            }

            const synced = await alignFirebaseWithSessionCookie(readyAuth, null);
            if (synced) return;
            if (isExplicitLogoutActive()) {
              await clearAllServerSessions();
              setUser(null);
              setSessionReady(false);
              setSessionError(null);
              setLoading(false);
              return;
            }
            setUser(sessionUser);
            setSessionReady(true);
            setSessionError(null);
            setLoading(false);
            return;
          }

          if (activeUser) {
            const generation = ++authGenerationRef.current;
            const uid = activeUser.uid;

            setFirebaseUser(activeUser);
            setUser(buildFallbackUser(activeUser));
            setSessionReady(false);
            setSessionError(null);
            setLoading(false);

            void handleSignedInUser(activeUser, {
              isSigningOut: () => signingOutRef.current
            }).then(({ profile, sessionReady: ready, sessionError: err }) => {
              if (signingOutRef.current) return;
              const currentUid = readyAuth.currentUser?.uid;
              if (isStaleAuth(generation, uid, currentUid)) return;
              if (profile.uid !== uid) return;

              setUser(profile);
              setSessionReady(ready);
              setSessionError(err ?? null);
            });
          } else {
            authGenerationRef.current += 1;
            setFirebaseUser(null);
            setUser(null);
            setSessionReady(false);
            setSessionError(null);
            setLoading(false);
          }
        })();
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isConfigured, isStaleAuth]);

  const signIn = useCallback(async (email: string, password: string) => {
    signingOutRef.current = false;
    const auth = await ensureAuthReady();
    await clearAllServerSessions();
    if (auth.currentUser) {
      try {
        await firebaseSignOut(auth);
      } catch {
        // ignore
      }
    }
    clearExplicitLogoutMark();
    clearGlobalLogoutMarker();
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      clearExplicitLogoutMark();
      clearGlobalLogoutMarker();
      signingOutRef.current = false;
      const auth = await ensureAuthReady();
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(credential.user, { displayName });
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    signingOutRef.current = false;
    const auth = await ensureAuthReady();
    // Eski IndexedDB + stale panel_session yeni hesabı ezmesin
    await clearAllServerSessions();
    if (auth.currentUser) {
      try {
        await firebaseSignOut(auth);
      } catch {
        // ignore
      }
    }
    clearExplicitLogoutMark();
    clearGlobalLogoutMarker();
    const { signInWithGoogle: googleSignIn } = await import(
      '@/lib/firebase/google-auth'
    );
    return googleSignIn(auth);
  }, []);

  const signInWithApple = useCallback(async () => {
    signingOutRef.current = false;
    const auth = await ensureAuthReady();
    await clearAllServerSessions();
    if (auth.currentUser) {
      try {
        await firebaseSignOut(auth);
      } catch {
        // ignore
      }
    }
    clearExplicitLogoutMark();
    clearGlobalLogoutMarker();
    const { signInWithApple: appleSignIn } = await import(
      '@/lib/firebase/apple-auth'
    );
    return appleSignIn(auth);
  }, []);

  const syncSession = useCallback(async (): Promise<boolean> => {
    if (signingOutRef.current) return false;

    const auth = await ensureAuthReady();
    const fbUser = auth.currentUser;
    if (!fbUser) return false;

    const generation = authGenerationRef.current;
    const uid = fbUser.uid;

    setSessionReady(false);
    setSessionError(null);
    const { profile, sessionReady: ready, sessionError: err } =
      await handleSignedInUser(fbUser, {
        isSigningOut: () => signingOutRef.current
      });

    if (isStaleAuth(generation, uid, auth.currentUser?.uid)) return false;
    if (profile.uid !== uid) return false;

    setUser(profile);
    setSessionReady(ready);
    setSessionError(err ?? null);
    return ready;
  }, [isStaleAuth]);

  const signOut = useCallback(async () => {
    signingOutRef.current = true;
    authGenerationRef.current += 1;
    markExplicitLogout();
    markGlobalLogout();
    setUser(null);
    setFirebaseUser(null);
    setSessionReady(false);
    setSessionError(null);
    setLoading(false);
    clearAuthTransientStorage();

    try {
      const auth = await ensureAuthReady();
      await firebaseSignOut(auth);
      await clearAllServerSessions();
    } catch {
      // ignore
    } finally {
      setTimeout(() => {
        if (!isExplicitLogoutActive() && !isGlobalLogoutActive()) {
          signingOutRef.current = false;
        }
      }, 3000);
    }
  }, []);

  const signOutPanel = useCallback(async () => {
    signingOutRef.current = true;
    authGenerationRef.current += 1;
    markExplicitLogout();
    markGlobalLogout();
    setUser(null);
    setFirebaseUser(null);
    setSessionReady(false);
    setSessionError(null);
    setLoading(false);
    clearAuthTransientStorage();

    try {
      const auth = await ensureAuthReady();
      await firebaseSignOut(auth);
      await clearAllServerSessions();
    } catch {
      // ignore
    } finally {
      setTimeout(() => {
        if (!isExplicitLogoutActive() && !isGlobalLogoutActive()) {
          signingOutRef.current = false;
        }
      }, 3000);
    }

    window.location.href = panelLoginHref();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const auth = await ensureAuthReady();
    await sendPasswordResetEmail(auth, email);
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const auth = await ensureAuthReady();
      const fbUser = auth.currentUser;
      if (!fbUser?.email) {
        throw new Error('Giriş gerekli');
      }

      const credential = EmailAuthProvider.credential(
        fbUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(fbUser, credential);
      await updatePassword(fbUser, newPassword);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        sessionReady,
        sessionError,
        isConfigured,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut,
        signOutPanel,
        resetPassword,
        changePassword,
        syncSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
