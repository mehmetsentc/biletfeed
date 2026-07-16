import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { updateOrganizerStatus, updateOrganizerCommission } from '@/lib/services/admin-dashboard';

const patchSchema = z.object({
  status: z.enum(['approved', 'pending', 'suspended']).optional(),
  commissionRate: z.number().min(0).max(1).nullable().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardAdminMutation(request, 'organizers.manage');
  if ('error' in guard) return guard.error;

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
