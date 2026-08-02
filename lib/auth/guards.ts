import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/types';
import {
  verifyOrganizerPanelSession,
  sessionHasRole
} from '@/lib/auth/session';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import {
  panelServerLoginPath,
  panelServerPath
} from '@/lib/auth/panel-paths';
import { adminHref, siteHref } from '@/lib/config/domain';
import { getAdminAccessByFirebaseUid } from '@/lib/services/admin-access';

export async function requirePanelAuth(
  requiredRole: UserRole = 'ROLE_USER',
  returnPath = '/baslangic'
) {
  const host = (await headers()).get('host');
  const session = await verifyOrganizerPanelSession();
  if (!session) {
    redirect(panelServerLoginPath(host, returnPath));
  }
  if (!sessionHasRole(session, requiredRole)) {
    redirect(panelServerLoginPath(host, returnPath));
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
      redirect(
        siteHref(`/giris?redirect=${encodeURIComponent(returnPath)}`)
      );
    }
    redirect(siteHref('/giris'));
  }
  if (!sessionHasRole(session, requiredRole)) {
    if (returnPath) {
      redirect(
        siteHref(
          `/giris?redirect=${encodeURIComponent(returnPath)}&error=admin_required`
        )
      );
    }
    redirect(`${siteHref('/')}?error=unauthorized`);
  }
  return session;
}

/**
 * Organizatör paneli — oturum + (rol VEYA organizer kaydı).
 * Rol gecikmesinde login↔baslangic döngüsüne düşmemek için organizer profili yeter.
 */
export async function requireOrganizer() {
  const host = (await headers()).get('host');
  const session = await verifyOrganizerPanelSession();
  if (!session) {
    redirect(panelServerLoginPath(host, '/baslangic'));
  }

  if (sessionHasRole(session, 'ROLE_ORGANIZER')) {
    return session;
  }

  const organizer = await getOrganizerForSession(session.uid, session.email);
  if (organizer) {
    return session;
  }

  redirect(panelServerPath('/kurulum', host));
}

export async function requireAdmin() {
  const session = await requireAuth('ROLE_ADMIN', adminHref('/'));
  const access = await getAdminAccessByFirebaseUid(session.uid, session.email);
  if (!access || (!access.isSuperAdmin && access.permissions.length === 0)) {
    redirect(`${siteHref('/')}?error=unauthorized`);
  }
  return session;
}
