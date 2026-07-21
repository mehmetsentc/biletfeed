/** Ana site, panel ve kapı oturum çerezlerini temizler */
export async function clearAllServerSessions(): Promise<void> {
  const run = () =>
    fetch('/api/auth/logout-all', {
      method: 'DELETE',
      credentials: 'same-origin',
      cache: 'no-store'
    });

  try {
    const res = await run();
    if (res.ok) return;
    // Tek yeniden dene (geçici ağ / race)
    await run();
  } catch {
    // ignore — istemci yine Firebase signOut yapacak
  }
}
