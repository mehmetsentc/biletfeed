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
  getAdminAccessByFirebaseUid,
  revokeAdminAccess,
  updateAdminPermissions
} from '@/lib/services/admin-access';

const patchSchema = z.object({
  permissions: z.array(z.string()).min(1)
});

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await requireSuperAdminSession();
  if (!session) return adminForbidden();

  const { userId } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  const actor = await getAdminAccessByFirebaseUid(session.uid, session.email);
  if (!actor?.userId) return adminUnauthorized();

  try {
    const admin = await updateAdminPermissions({
      userId,
      permissions: sanitizeAdminPermissions(parsed.data.permissions),
      actorUserId: actor.userId
    });
    return NextResponse.json({ success: true, admin });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Güncelleme başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const session = await requireSuperAdminSession();
  if (!session) return adminForbidden();

  const { userId } = await params;
  const actor = await getAdminAccessByFirebaseUid(session.uid, session.email);
  if (!actor?.userId) return adminUnauthorized();

  try {
    await revokeAdminAccess({ userId, actorUserId: actor.userId });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kaldırma başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
