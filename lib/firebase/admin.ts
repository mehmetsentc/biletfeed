import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let adminApp: App;
let adminAuth: Auth;

interface ServiceAccountCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function loadServiceAccountFromJsonEnv(): ServiceAccountCredentials | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    const json = JSON.parse(raw) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    if (!json.project_id || !json.client_email || !json.private_key) return null;
    return {
      projectId: json.project_id,
      clientEmail: json.client_email,
      privateKey: json.private_key
    };
  } catch {
    return null;
  }
}

function loadServiceAccountFromFile(): ServiceAccountCredentials | null {
  const filePath = resolve(
    process.cwd(),
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'firebase-admin.json'
  );

  if (!existsSync(filePath)) return null;

  const json = JSON.parse(readFileSync(filePath, 'utf8')) as {
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };

  if (!json.project_id || !json.client_email || !json.private_key) {
    return null;
  }

  return {
    projectId: json.project_id,
    clientEmail: json.client_email,
    privateKey: json.private_key
  };
}

function loadServiceAccountFromEnv(): ServiceAccountCredentials | null {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    '\n'
  );

  if (!projectId || !clientEmail || !privateKey) return null;

  return { projectId, clientEmail, privateKey };
}

function getServiceAccount(): ServiceAccountCredentials {
  const credentials =
    loadServiceAccountFromFile() ??
    loadServiceAccountFromJsonEnv() ??
    loadServiceAccountFromEnv();

  if (!credentials) {
    throw new Error(
      'Firebase Admin yapılandırması eksik. firebase-admin.json dosyasını proje köküne koyun veya FIREBASE_ADMIN_* değişkenlerini ayarlayın.'
    );
  }

  return credentials;
}

function createAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const { projectId, clientEmail, privateKey } = getServiceAccount();
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    ...(storageBucket ? { storageBucket } : {})
  });
}

export function getAdminApp(): App {
  if (!adminApp) adminApp = createAdminApp();
  return adminApp;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) adminAuth = getAuth(getAdminApp());
  return adminAuth;
}

export function isFirebaseAdminConfigured(): boolean {
  return (
    loadServiceAccountFromFile() !== null ||
    loadServiceAccountFromJsonEnv() !== null ||
    loadServiceAccountFromEnv() !== null
  );
}
