const AUTH_PATHS = ['/giris', '/kayit', '/sifremi-unuttum'];

let redirectDone = false;

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.includes(pathname);
}

export function getPostLoginPath(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  const fallback = pathname === '/kayit' ? '/ilgi-alanlari' : '/';
  return params.get('redirect') || fallback;
}

/** Giriş/kayıt sayfasındaysa ana sayfaya yönlendir (tek sefer). */
export function redirectFromAuthPagesIfNeeded(): void {
  if (typeof window === 'undefined' || redirectDone) return;

  const { pathname, search } = window.location;
  if (!isAuthPath(pathname)) return;

  redirectDone = true;
  window.location.replace(getPostLoginPath(pathname, search));
}

export function resetAuthRedirectGuard(): void {
  redirectDone = false;
}
