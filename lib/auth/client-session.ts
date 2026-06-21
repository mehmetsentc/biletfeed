import type { User as FirebaseUser } from 'firebase/auth';

export async function establishClientSession(
  firebaseUser: FirebaseUser
): Promise<void> {
  const idToken = await firebaseUser.getIdToken(true);
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    credentials: 'same-origin'
  });
  if (!res.ok) {
    throw new Error('Oturum oluşturulamadı');
  }
}

export async function establishClientSessionWithRetry(
  firebaseUser: FirebaseUser
): Promise<void> {
  try {
    await establishClientSession(firebaseUser);
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    await establishClientSession(firebaseUser);
  }
}
