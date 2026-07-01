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
  SessionEstablishError
} from '@/lib/auth/client-session';
import { getFirebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';
import { clearAuthTransientStorage } from '@/lib/auth/logout-cleanup';
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
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  syncSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchUserProfile(
  firebaseUser: FirebaseUser
): Promise<User> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      if (data.user) return data.user;
    }
  } catch {
    // fallback below
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
  fbUser: FirebaseUser
): Promise<{ profile: User; sessionReady: boolean; sessionError?: string }> {
  try {
    await establishClientSessionWithRetry(fbUser);
    const profile = await fetchUserProfile(fbUser);
    return { profile, sessionReady: true };
  } catch (err) {
    try {
      await fetch('/api/auth/session', { method: 'DELETE', credentials: 'same-origin' });
    } catch {
      // ignore
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
        if (fbUser) {
          const generation = ++authGenerationRef.current;
          const uid = fbUser.uid;

          setFirebaseUser(fbUser);
          setUser(buildFallbackUser(fbUser));
          setSessionReady(false);
          setSessionError(null);
          setLoading(false);

          void handleSignedInUser(fbUser).then(
            ({ profile, sessionReady: ready, sessionError: err }) => {
              const currentUid = readyAuth.currentUser?.uid;
              if (isStaleAuth(generation, uid, currentUid)) return;

              setUser(profile);
              setSessionReady(ready);
              setSessionError(err ?? null);
            }
          );
        } else {
          authGenerationRef.current += 1;
          setFirebaseUser(null);
          setUser(null);
          setSessionReady(false);
          setSessionError(null);
          setLoading(false);
        }
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isConfigured, isStaleAuth]);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = await ensureAuthReady();
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
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
    const auth = await ensureAuthReady();
    const { signInWithGoogle: googleSignIn } = await import(
      '@/lib/firebase/google-auth'
    );
    return googleSignIn(auth);
  }, []);

  const signInWithApple = useCallback(async () => {
    const auth = await ensureAuthReady();
    const { signInWithApple: appleSignIn } = await import(
      '@/lib/firebase/apple-auth'
    );
    return appleSignIn(auth);
  }, []);

  const syncSession = useCallback(async (): Promise<boolean> => {
    const auth = await ensureAuthReady();
    const fbUser = auth.currentUser;
    if (!fbUser) return false;

    const generation = authGenerationRef.current;
    const uid = fbUser.uid;

    setSessionReady(false);
    setSessionError(null);
    const { profile, sessionReady: ready, sessionError: err } =
      await handleSignedInUser(fbUser);

    if (isStaleAuth(generation, uid, auth.currentUser?.uid)) return false;

    setUser(profile);
    setSessionReady(ready);
    setSessionError(err ?? null);
    return ready;
  }, [isStaleAuth]);

  const signOut = useCallback(async () => {
    authGenerationRef.current += 1;
    setUser(null);
    setFirebaseUser(null);
    setSessionReady(false);
    setSessionError(null);
    setLoading(false);
    clearAuthTransientStorage();

    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'same-origin'
      });
    } catch {
      // ignore
    }

    const auth = await ensureAuthReady();
    await firebaseSignOut(auth);
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
