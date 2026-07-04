/** Ana site ve panel oturum çerezlerini temizler */
export async function clearAllServerSessions(): Promise<void> {
  await Promise.all([
    fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'same-origin'
    }),
    fetch('/api/auth/panel-session', {
      method: 'DELETE',
      credentials: 'same-origin'
    })
  ]);
}
