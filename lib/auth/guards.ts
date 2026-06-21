import type { UserRole } from '@/types';
import { verifySessionCookie, sessionHasRole } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export async function requireAuth(requiredRole: UserRole = 'ROLE_USER') {
  const session = await verifySessionCookie();
  if (!session || !sessionHasRole(session, requiredRole)) {
    redirect('/giris');
  }
  return session;
}

export async function requireOrganizer() {
  return requireAuth('ROLE_ORGANIZER');
}

export async function requireAdmin() {
  return requireAuth('ROLE_ADMIN');
}
