import { cookies } from 'next/headers';
import type { UserRole } from '@/types';
import { hasRole, ROLES } from '@/lib/auth/roles';
import {
  buildSignedSessionToken,
  verifySessionSignature
} from '@/lib/auth/session-crypto';
import { resolveUserRoleForSession } from '@/lib/services/user-queries';

// firebase-admin import YOK — ESM uyumsuzluğunu önlemek için

export const SESSION_COOKIE_NAME = 'session';
export const SESSION_EXPIRES_MS = 60 * 60 * 24 * 5 * 1000;

export interface SessionUser {
  uid: string;
  email?: string;
  role: UserRole;
}

export function buildSessionCookie(
  uid: string,
  email: string,
  role: UserRole,
  expiresMs = SESSION_EXPIRES_MS
): string {
  return buildSignedSessionToken({
    uid,
    email,
    role,
    exp: Date.now() + expiresMs
  });
}

function verifySimpleSession(token: string): SessionUser | null {
  try {
    const dotIdx = token.lastIndexOf('.');
    if (dotIdx === -1) return null;

    const b64 = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);

    if (!verifySessionSignature(b64, sig)) return null;

    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString()) as {
      uid?: string;
      email?: string;
      role?: string;
      exp?: number;
    };

    if (!parsed.uid || !parsed.exp) return null;
    if (Date.now() > parsed.exp) return null;

    return {
      uid: parsed.uid,
      email: parsed.email,
      role: (parsed.role as UserRole) ?? ROLES.USER
    };
  } catch {
    return null;
  }
}

export async function verifySessionCookie(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!session) return null;

    const parsed = verifySimpleSession(session);
    if (!parsed) return null;

    try {
      const dbRole = await resolveUserRoleForSession(parsed.uid, parsed.email);
      if (dbRole) {
        return { ...parsed, role: dbRole };
      }
    } catch {
      /* DB geçici hata — çerezdeki rol ile devam et */
    }

    return parsed;
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
