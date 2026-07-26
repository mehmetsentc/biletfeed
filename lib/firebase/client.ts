import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth
} from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

function createFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  return initializeApp(firebaseConfig);
}

let app: FirebaseApp;
let auth: Auth | undefined;
let storage: FirebaseStorage;
let persistenceReady: Promise<void> | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!app) app = createFirebaseApp();
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    if (typeof window !== 'undefined') {
      // Redirect sonucu yalnızca gerçek web ortamında işlenmeli. Capacitor
      // (native iOS/Android) tarafında redirect akışı hiç kullanılmıyor —
      // native girişler signInWithCredential ile tamamlanıyor. Buna rağmen
      // getRedirectResult() çağrısı Firebase'in gizli iframe/çerez tabanlı
      // resolver mekanizmasını (ör. {authDomain}/__/auth/iframe) tetikliyor;
      // bu da App Tracking Transparency izni reddedilmiş olsa bile devreye
      // girip App Store Guideline 5.1.1(iv) ihlaline yol açabiliyor. Bu yüzden
      // native'de bu çağrıyı hiç yapmıyoruz (getFirebaseAuth() en erken
      // çağrılan yer olduğu için asıl kaçak noktası burasıydı).
      const isCapacitorNative =
        !!(window as unknown as Record<string, unknown>)['Capacitor'];
      if (!isCapacitorNative) {
        void import('@/lib/firebase/google-auth').then(
          ({ consumeGoogleRedirectResult }) => {
            consumeGoogleRedirectResult(auth!);
          }
        );
      }
      persistenceReady = setPersistence(auth, browserLocalPersistence).then(
        () => undefined
      );
    }
  }
  return auth;
}

/** Oturum açmadan önce persistence hazır olsun. */
export async function ensureAuthReady(): Promise<Auth> {
  const instance = getFirebaseAuth();
  if (persistenceReady) await persistenceReady;
  return instance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) storage = getStorage(getFirebaseApp());
  return storage;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}
