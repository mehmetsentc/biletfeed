import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerApi } from '@/lib/auth/organizer-route';
import { updateOrganizerVenue } from '@/lib/services/organizer-panel';
import { seatPlanSchema } from '@/lib/api/seat-plan-schema';

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  address: z.string().min(2).max(300).optional(),
  capacity: z.number().int().min(1).max(100000).optional(),
  description: z.string().max(500).optional(),
  seatPlan: seatPlanSchema.optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const { error, ctx } = await requireOrganizerApi();
  if (error) return error;

  const { id } = await params;
  const json = await request.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    const venue = await updateOrganizerVenue(ctx.organizer.id, id, parsed.data);
    return NextResponse.json({ venue });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mekan güncellenemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
