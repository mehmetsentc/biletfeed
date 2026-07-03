import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie, sessionHasRole } from '@/lib/auth/session';
import { rejectAdminCsrf } from '@/lib/auth/admin-csrf';
import { updateOrganizerStatus, updateOrganizerCommission } from '@/lib/services/admin-dashboard';

const patchSchema = z.object({
  status: z.enum(['approved', 'pending', 'suspended']).optional(),
  commissionRate: z.number().min(0).max(1).optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = rejectAdminCsrf(request);
  if (csrf) return csrf;

  const session = await verifySessionCookie();
  if (!session || !sessionHasRole(session, 'ROLE_ADMIN')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });

  try {
    if (parsed.data.status !== undefined) {
      await updateOrganizerStatus(id, parsed.data.status);
    }
    if (parsed.data.commissionRate !== undefined) {
      await updateOrganizerCommission(id, parsed.data.commissionRate);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 });
  }
}
