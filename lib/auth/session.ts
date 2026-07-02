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
export const PANEL_SESSION_COOKIE_NAME = 'panel_session';
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

async function resolveSessionFromCookieValue(
  token: string | undefined
): Promise<SessionUser | null> {
  if (!token) return null;

  const parsed = verifySimpleSession(token);
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
}

export async function verifySessionCookie(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    return resolveSessionFromCookieValue(
      cookieStore.get(SESSION_COOKIE_NAME)?.value
    );
  } catch {
    return null;
  }
}

/** Organizatör panel oturumu — ana site oturumundan bağımsız */
export async function verifyPanelSessionCookie(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    return resolveSessionFromCookieValue(
      cookieStore.get(PANEL_SESSION_COOKIE_NAME)?.value
    );
  } catch {
    return null;
  }
}

/** Panel layout / API — yalnızca panel oturumu */
export async function verifyOrganizerPanelSession(): Promise<SessionUser | null> {
  return verifyPanelSessionCookie();
}

export function sessionHasRole(
  session: SessionUser | null,
  requiredRole: UserRole
): boolean {
  if (!session) return false;
  return hasRole(session.role, requiredRole);
}
