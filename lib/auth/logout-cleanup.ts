/** OAuth ve geçici auth anahtarlarını temizler — hesap değişiminde sızıntıyı önler */
export function clearAuthTransientStorage(): void {
  if (typeof window === 'undefined') return;

  const localKeys = [
    'bf_google_redirect_pending',
    'bf_google_redirect_pending_at',
    'bf_apple_redirect_pending',
    'bf_apple_redirect_pending_at'
  ];
  for (const key of localKeys) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  const sessionKeys = ['bf_google_auth_error', 'bf_apple_auth_error'];
  for (const key of sessionKeys) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
