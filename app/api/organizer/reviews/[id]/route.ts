import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerApi } from '@/lib/auth/organizer-route';
import {
  deleteOrganizerReview,
  setReviewHidden
} from '@/lib/services/organizer-panel';

const patchSchema = z.object({
  hidden: z.boolean()
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
    await setReviewHidden(ctx.organizer.id, id, parsed.data.hidden);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'İşlem başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, ctx } = await requireOrganizerApi();
  if (error) return error;

  const { id } = await params;

  try {
    await deleteOrganizerReview(ctx.organizer.id, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Silinemedi';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
