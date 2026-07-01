import { NextResponse } from 'next/server';
import { requireAdminAccessContext } from '@/lib/auth/admin-api';
import { sanitizeAdminPermissions } from '@/lib/auth/admin-permissions';

/** Oturum açmış adminin efektif yetkileri — sidebar filtreleme için */
export async function GET() {
  const ctx = await requireAdminAccessContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }

  return NextResponse.json({
    isSuperAdmin: ctx.access.isSuperAdmin,
    permissions: ctx.access.isSuperAdmin
      ? ctx.access.permissions
      : sanitizeAdminPermissions(ctx.access.permissions)
  });
}
