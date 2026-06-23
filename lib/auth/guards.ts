import type { UserRole } from '@/types';
import {
  verifySessionCookie,
  sessionHasRole
} from '@/lib/auth/session';
import { redirect } from 'next/navigation';

function loginRedirect(returnPath?: string): never {
  if (returnPath) {
    redirect(`/giris?redirect=${encodeURIComponent(returnPath)}`);
  }
  redirect('/giris');
}

export async function requireAuth(
  requiredRole: UserRole = 'ROLE_USER',
  returnPath?: string
) {
  const session = await verifySessionCookie();
  if (!session) {
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
