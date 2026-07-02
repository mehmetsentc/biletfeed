/** Firebase REST API ile ID token doğrular — Admin SDK gerekmez */
export async function verifyIdTokenViaRestApi(
  idToken: string
): Promise<{ uid: string; email: string }> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('NEXT_PUBLIC_FIREBASE_API_KEY ayarlanmamış');

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    }
  );

  if (!res.ok) throw new Error('Token geçersiz');

  const data = (await res.json()) as {
    users?: Array<{ localId: string; email?: string }>;
  };
  const user = data.users?.[0];
  if (!user?.localId) throw new Error('Kullanıcı bulunamadı');

  return { uid: user.localId, email: user.email ?? '' };
}
