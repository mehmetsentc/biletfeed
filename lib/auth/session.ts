import { createHmac } from 'crypto';
import { cookies } from 'next/headers';
import type { UserRole } from '@/types';
import { hasRole, ROLES } from '@/lib/auth/roles';
import { resolveUserRoleForSession } from '@/lib/services/user-queries';

// firebase-admin import YOK — ESM uyumsuzluğunu önlemek için

export const SESSION_COOKIE_NAME = 'session';
export const SESSION_EXPIRES_MS = 60 * 60 * 24 * 5 * 1000;

export interface SessionUser {
  uid: string;
  email?: string;
  role: UserRole;
}

const SIMPLE_SESSION_SECRET =
  process.env.NEXTAUTH_SECRET ??
  process.env.TICKET_SECRET_KEY ??
  'biletfeed-simple-session-fallback-key';

export function buildSessionCookie(
  uid: string,
  email: string,
  role: UserRole,
  expiresMs = SESSION_EXPIRES_MS
): string {
  const payload = JSON.stringify({
    uid,
    email,
    role,
    exp: Date.now() + expiresMs
  });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = createHmac('sha256', SIMPLE_SESSION_SECRET).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

function verifySimpleSession(token: string): SessionUser | null {
  try {
    const dotIdx = token.lastIndexOf('.');
    if (dotIdx === -1) return null;

    const b64 = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);

    const expectedSig = createHmac('sha256', SIMPLE_SESSION_SECRET)
      .update(b64)
      .digest('hex');

    if (sig !== expectedSig) return null;

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
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;

  const parsed = verifySimpleSession(session);
  if (!parsed) return null;

  // Rol kaynağı: veritabanı + bootstrap e-posta (çerezdeki rol eski kalabilir)
  const dbRole = await resolveUserRoleForSession(parsed.uid, parsed.email);
  if (dbRole) {
    return { ...parsed, role: dbRole };
  }

  return parsed;
}

export function sessionHasRole(
  session: SessionUser | null,
  requiredRole: UserRole
): boolean {
  if (!session) return false;
  return hasRole(session.role, requiredRole);
}
