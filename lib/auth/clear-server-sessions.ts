/** Ana site, panel ve kapı oturum çerezlerini temizler */
export async function clearAllServerSessions(): Promise<void> {
  await fetch('/api/auth/logout-all', {
    method: 'DELETE',
    credentials: 'same-origin',
    cache: 'no-store'
  }).catch(() => null);
}
