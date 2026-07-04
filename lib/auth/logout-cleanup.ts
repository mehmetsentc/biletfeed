const EXPLICIT_LOGOUT_KEY = 'bf_explicit_logout';
const EXPLICIT_LOGOUT_TTL_MS = 60_000;

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

/** Kullanıcı bilinçli çıkış yaptı — oturum çerezinden otomatik yeniden girişi engelle */
export function markExplicitLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(EXPLICIT_LOGOUT_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function clearExplicitLogoutMark(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);
  } catch {
    // ignore
  }
}

export function isExplicitLogoutActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(EXPLICIT_LOGOUT_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at) || Date.now() - at > EXPLICIT_LOGOUT_TTL_MS) {
      sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
