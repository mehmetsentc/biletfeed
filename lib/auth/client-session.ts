import type { User as FirebaseUser } from 'firebase/auth';

export class SessionEstablishError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'SessionEstablishError';
    this.status = status;
    this.code = code;
  }
}

async function postSession(
  endpoint: '/api/auth/session' | '/api/auth/panel-session',
  firebaseUser: FirebaseUser
): Promise<void> {
  const idToken = await firebaseUser.getIdToken(true);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    credentials: 'same-origin'
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
    };
    throw new SessionEstablishError(
      data.error || 'Oturum oluşturulamadı',
      res.status,
      res.status === 429 ? 'rate_limited' : data.code
    );
  }
}

export async function establishClientSession(
  firebaseUser: FirebaseUser
): Promise<void> {
  await postSession('/api/auth/session', firebaseUser);
}

export async function establishPanelClientSession(
  firebaseUser: FirebaseUser
): Promise<void> {
  await postSession('/api/auth/panel-session', firebaseUser);
}

async function establishWithRetry(
  establish: (user: FirebaseUser) => Promise<void>,
  firebaseUser: FirebaseUser
): Promise<void> {
  try {
    await establish(firebaseUser);
  } catch (err) {
    if (
      err instanceof SessionEstablishError &&
      (err.code === 'firebase_admin_missing' || err.code === 'rate_limited')
    ) {
      throw err;
    }
    await new Promise((r) => setTimeout(r, 800));
    await establish(firebaseUser);
  }
}

export async function establishClientSessionWithRetry(
  firebaseUser: FirebaseUser
): Promise<void> {
  await establishWithRetry(establishClientSession, firebaseUser);
}

export async function establishPanelClientSessionWithRetry(
  firebaseUser: FirebaseUser
): Promise<void> {
  await establishWithRetry(establishPanelClientSession, firebaseUser);
}

