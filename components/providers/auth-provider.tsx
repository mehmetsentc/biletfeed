'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  ensureAuthReady
} from '@/lib/firebase/client';
import { redirectFromAuthPagesIfNeeded } from '@/lib/firebase/auth-redirect';
import {
  establishClientSessionWithRetry
} from '@/lib/auth/client-session';
import type { User } from '@/types';
import { ROLES } from '@/lib/auth/roles';

interface AuthContextValue {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

async function handleSignedInUser(fbUser: FirebaseUser) {
  redirectFromAuthPagesIfNeeded();
  try {
    await establishClientSessionWithRetry(fbUser);
    return await fetchUserProfile(fbUser);
  } catch {
    return buildFallbackUser(fbUser);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isFirebaseConfigured();

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    void ensureAuthReady().then((auth) => {
      unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        setFirebaseUser(fbUser);

        if (fbUser) {
          setUser(buildFallbackUser(fbUser));
          setLoading(false);
          void handleSignedInUser(fbUser).then(setUser);
        } else {
          setUser(null);
          setLoading(false);
        }
      });
    });

    return () => unsubscribe?.();
  }, [isConfigured]);

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

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const auth = await ensureAuthReady();
    const { signInWithGoogle: googleSignIn } = await import(
      '@/lib/firebase/google-auth'
    );
    await googleSignIn(auth);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE', credentials: 'same-origin' });
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

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isConfigured,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword
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
