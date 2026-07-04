import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { AdminPermission } from '@/lib/auth/admin-permissions';
import {
  adminForbidden,
  adminUnauthorized,
  requireAdminPermission,
  requireAdminSession
} from '@/lib/auth/admin-api';
import { rejectAdminCsrf } from '@/lib/auth/admin-csrf';

/** Otomasyon (CI/script) — CRON_SECRET değil, yalnızca ADMIN_SECRET */
export function isAdminAutomationAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

/** Admin mutasyonu: CSRF + granüler yetki */
export async function guardAdminMutation(
  request: NextRequest,
  permission: AdminPermission
) {
  const csrf = rejectAdminCsrf(request);
  if (csrf) return { error: csrf } as const;

  const ctx = await requireAdminPermission(permission);
  if (!ctx) return { error: adminForbidden() } as const;

  return { ctx } as const;
}

/** Admin okuma: oturum + granüler yetki */
export async function guardAdminRead(permission: AdminPermission) {
  const ctx = await requireAdminPermission(permission);
  if (!ctx) return { error: adminForbidden() } as const;
  return { ctx } as const;
}

/** Yıkıcı otomasyon veya admin yetkili oturum */
export async function guardAdminAutomationOrMutation(
  request: NextRequest,
  permission: AdminPermission
) {
  if (isAdminAutomationAuthorized(request)) {
    return { automation: true as const };
  }
  return guardAdminMutation(request, permission);
}

/** Basit admin oturum kontrolü (me/access gibi) */
export async function guardAdminSessionOnly() {
  const session = await requireAdminSession();
  if (!session) return { error: adminUnauthorized() } as const;
  return { session } as const;
}

export function automationForbiddenResponse() {
  return NextResponse.json(
    { error: 'Otomasyon için ADMIN_SECRET gerekli' },
    { status: 403 }
  );
}
