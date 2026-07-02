import { redirect } from 'next/navigation';
import type { UserRole } from '@/types';
import {
  verifyOrganizerPanelSession,
  sessionHasRole
} from '@/lib/auth/session';
import { panelLoginHref } from '@/lib/config/domain';
import { getAdminAccessByFirebaseUid } from '@/lib/services/admin-access';

function loginRedirect(returnPath?: string): never {
  if (returnPath) {
    redirect(panelLoginHref(returnPath));
  }
  redirect(panelLoginHref());
}

export async function requirePanelAuth(
  requiredRole: UserRole = 'ROLE_USER',
  returnPath?: string
) {
  const session = await verifyOrganizerPanelSession();
  if (!session) {
    loginRedirect(returnPath);
  }
  if (!sessionHasRole(session, requiredRole)) {
    loginRedirect(returnPath);
  }
  return session;
}

export async function requireAuth(
  requiredRole: UserRole = 'ROLE_USER',
  returnPath?: string
) {
  const { verifySessionCookie } = await import('@/lib/auth/session');
  const session = await verifySessionCookie();
  if (!session) {
    if (returnPath) {
      redirect(`/giris?redirect=${encodeURIComponent(returnPath)}`);
    }
    redirect('/giris');
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
  return requirePanelAuth('ROLE_ORGANIZER', '/organizator-panel/baslangic');
}

export async function requireAdmin() {
  const session = await requireAuth('ROLE_ADMIN', '/admin');
  const access = await getAdminAccessByFirebaseUid(session.uid, session.email);
  if (!access || (!access.isSuperAdmin && access.permissions.length === 0)) {
    redirect('/?error=unauthorized');
  }
  return session;
}
