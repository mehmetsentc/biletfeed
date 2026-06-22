import type { UserRole } from '@/types';
import {
  verifySessionCookie,
  sessionHasRole,
  SESSION_COOKIE_NAME
} from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

function loginRedirect(returnPath?: string): never {
  if (returnPath) {
    redirect(`/giris?redirect=${encodeURIComponent(returnPath)}`);
  }
  redirect('/giris');
}

async function clearInvalidSessionCookie() {
  const session = await verifySessionCookie();
  if (session) return;
  const cookieStore = await cookies();
  if (!cookieStore.get(SESSION_COOKIE_NAME)?.value) return;
  cookieStore.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
}

export async function requireAuth(
  requiredRole: UserRole = 'ROLE_USER',
  returnPath?: string
) {
  const session = await verifySessionCookie();
  if (!session) {
    await clearInvalidSessionCookie();
    loginRedirect(returnPath);
  }
  if (!sessionHasRole(session, requiredRole)) {
    if (returnPath) {
      redirect(
        `/giris?redirect=${encodeURIComponent(returnPath)}&error=admin_required`
      );
    }
    redirect('/?error=unauthorized');
  }
  return session;
}

export async function requireOrganizer() {
  return requireAuth('ROLE_ORGANIZER', '/organizator-panel/baslangic');
}

export async function requireAdmin() {
  return requireAuth('ROLE_ADMIN', '/admin');
}
