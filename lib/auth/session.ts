import { cookies } from 'next/headers';
import type { UserRole } from '@/types';
import { isFirebaseAdminConfigured, getAdminAuth } from '@/lib/firebase/admin';
import { hasRole, ROLES } from '@/lib/auth/roles';

const SESSION_COOKIE_NAME = 'session';

export interface SessionUser {
  uid: string;
  email?: string;
  role: UserRole;
}

export async function verifySessionCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;

  if (!isFirebaseAdminConfigured()) {
    return { uid: 'anonymous', role: ROLES.USER };
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const role =
      (decoded.role as UserRole | undefined) ?? ROLES.USER;

    return {
      uid: decoded.uid,
      email: decoded.email,
      role
    };
  } catch {
    return null;
  }
}

export function sessionHasRole(
  session: SessionUser | null,
  requiredRole: UserRole
): boolean {
  if (!session) return false;
  return hasRole(session.role, requiredRole);
}

export { SESSION_COOKIE_NAME };
