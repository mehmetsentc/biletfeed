import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  adminForbidden,
  adminUnauthorized,
  requireSuperAdminSession
} from '@/lib/auth/admin-api';
import { sanitizeAdminPermissions } from '@/lib/auth/admin-permissions';
import {
  assignAdminByEmail,
  getAdminAccessByFirebaseUid,
  listManagedAdmins
} from '@/lib/services/admin-access';

const assignSchema = z.object({
  email: z.string().email(),
  permissions: z.array(z.string()).min(1)
});

export async function GET() {
  const session = await requireSuperAdminSession();
  if (!session) return adminForbidden();

  const admins = await listManagedAdmins();
  return NextResponse.json({ admins });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await requireSuperAdminSession();
  if (!session) return adminForbidden();

  const parsed = assignSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  const actor = await getAdminAccessByFirebaseUid(session.uid, session.email);
  if (!actor?.userId) return adminUnauthorized();

  try {
    const admin = await assignAdminByEmail({
      email: parsed.data.email,
      permissions: sanitizeAdminPermissions(parsed.data.permissions),
      actorUserId: actor.userId
    });
    return NextResponse.json({ success: true, admin });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Atama başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
