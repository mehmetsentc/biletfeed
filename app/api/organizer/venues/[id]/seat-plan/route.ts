import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import {
  confirmVenueSeatPlanDraft,
  generateVenueSeatPlanDraft
} from '@/lib/services/venue-seat-plan-ai';
import { seatPlanSchema } from '@/lib/api/seat-plan-schema';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const generateSchema = z.object({
  mapImageUrl: z.string().url().max(1000).optional()
});

const confirmSchema = z.object({
  draft: seatPlanSchema.optional()
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek kaynağı' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const limited = rateLimitOrNull(
    request,
    `seat-ai:${ctx.organizer.id}`,
    10,
    60_000
  );
  if (limited) return limited;

  const { id } = await params;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') ?? 'generate';
  const json = await request.json().catch(() => ({}));

  try {
    if (action === 'confirm') {
      const parsed = confirmSchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Geçersiz taslak' }, { status: 400 });
      }
      const plan = await confirmVenueSeatPlanDraft({
        venueId: id,
        organizerId: ctx.organizer.id,
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
      venueId: id,
      organizerId: ctx.organizer.id,
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
