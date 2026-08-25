import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import {
  confirmVenueSeatPlanDraft,
  generateVenueSeatPlanDraft
} from '@/lib/services/venue-seat-plan-ai';
import { seatPlanSchema } from '@/lib/api/seat-plan-schema';

const generateSchema = z.object({
  venueId: z.string().uuid(),
  mapImageUrl: z.string().url().max(1000).optional()
});

const confirmSchema = z.object({
  venueId: z.string().uuid(),
  draft: seatPlanSchema.optional()
});

export async function POST(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'events.manage');
  if ('error' in guard) return guard.error;

  const url = new URL(request.url);
  const action = url.searchParams.get('action') ?? 'generate';
  const json = await request.json().catch(() => null);

  try {
    if (action === 'confirm') {
      const parsed = confirmSchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
      }
      const plan = await confirmVenueSeatPlanDraft({
        venueId: parsed.data.venueId,
        draft: parsed.data.draft as Parameters<
          typeof confirmVenueSeatPlanDraft
        >[0]['draft']
      });
      return NextResponse.json({ success: true, seatPlan: plan });
    }

    const parsed = generateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }
    const result = await generateVenueSeatPlanDraft({
      venueId: parsed.data.venueId,
      mapImageUrl: parsed.data.mapImageUrl
    });
    return NextResponse.json({
      success: true,
      draft: result.draft,
      meta: result.meta
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI işlem başarısız' },
      { status: 400 }
    );
  }
}
