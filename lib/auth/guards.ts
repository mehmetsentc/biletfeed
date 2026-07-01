import { redirect } from 'next/navigation';
import type { UserRole } from '@/types';
import {
  verifySessionCookie,
  sessionHasRole
} from '@/lib/auth/session';
import { getAdminAccessByFirebaseUid } from '@/lib/services/admin-access';

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
  const session = await requireAuth('ROLE_ADMIN', '/admin');
  const access = await getAdminAccessByFirebaseUid(session.uid, session.email);
  if (!access || (!access.isSuperAdmin && access.permissions.length === 0)) {
    redirect('/?error=unauthorized');
  }
  return session;
}
