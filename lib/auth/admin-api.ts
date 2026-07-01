import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import {
  verifySessionCookie,
  sessionHasRole,
  type SessionUser
} from '@/lib/auth/session';
import { ROLES, isSuperAdmin } from '@/lib/auth/roles';
import {
  type AdminPermission,
  hasAdminPermission,
  resolveAdminPathPermission,
  type AdminAccessContext
} from '@/lib/auth/admin-permissions';
import { getAdminAccessByFirebaseUid } from '@/lib/services/admin-access';

export async function requireAdminSession(): Promise<SessionUser | null> {
  const session = await verifySessionCookie();
  if (!session || !sessionHasRole(session, ROLES.ADMIN)) {
    return null;
  }
  return session;
}

export async function requireAdminAccessContext(): Promise<{
  session: SessionUser;
  access: AdminAccessContext;
} | null> {
  const session = await requireAdminSession();
  if (!session) return null;

  const access = await getAdminAccessByFirebaseUid(session.uid, session.email);
  if (!access) return null;

  if (!access.isSuperAdmin && access.permissions.length === 0) {
    return null;
  }

  return { session, access };
}

export async function requireSuperAdminSession(): Promise<SessionUser | null> {
  const session = await requireAdminSession();
  if (!session) return null;
  if (!isSuperAdmin(session.role)) return null;
  return session;
}

export async function requireAdminPermission(
  permission: AdminPermission
): Promise<{ session: SessionUser; access: AdminAccessContext } | null> {
  const ctx = await requireAdminAccessContext();
  if (!ctx) return null;
  if (!hasAdminPermission(ctx.access, permission)) return null;
  return ctx;
}

export function adminUnauthorized() {
  return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
}

export function adminForbidden() {
  return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
}

/** Server Component sayfaları — admin panel route koruması */
export async function enforceAdminPageAccess(pathname: string): Promise<AdminAccessContext> {
  const ctx = await requireAdminAccessContext();
  if (!ctx) {
    redirect('/giris?redirect=/admin&error=admin_required');
  }

  const permission = resolveAdminPathPermission(pathname);
  if (permission && !hasAdminPermission(ctx.access, permission)) {
    redirect('/admin?error=forbidden');
  }

  return ctx.access;
}

/** Süper admin sayfaları */
export async function enforceSuperAdminPageAccess(): Promise<void> {
  const session = await requireSuperAdminSession();
  if (!session) {
    redirect('/admin?error=forbidden');
  }
}
