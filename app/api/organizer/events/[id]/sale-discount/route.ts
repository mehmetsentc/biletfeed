import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { setEventSaleDiscount } from '@/lib/services/event-sale-discount';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

const bodySchema = z.object({
  campaignType: z.enum(['percent', 'bogo']).optional(),
  percent: z.number().int().min(1).max(100).nullable().optional(),
  active: z.boolean(),
  ticketTypeIds: z.array(z.string().uuid()).optional(),
  endsAt: z.string().datetime().nullable().optional()
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek kaynağı' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const limited = rateLimitOrNull(
    request,
    `org-sale:${ctx.organizer.id}`,
    30,
    60_000
  );
  if (limited) return limited;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  try {
    const event = await setEventSaleDiscount({
      eventId: id,
      organizerId: ctx.organizer.id,
      campaignType: parsed.data.campaignType,
      percent: parsed.data.percent ?? null,
      active: parsed.data.active,
      ticketTypeIds: parsed.data.ticketTypeIds,
      endsAt:
        parsed.data.endsAt === undefined
          ? undefined
          : parsed.data.endsAt
            ? new Date(parsed.data.endsAt)
            : null
    });
    return NextResponse.json({
      success: true,
      saleDiscount: {
        campaignType: event.saleCampaignType,
        percent: event.saleDiscountPercent,
        ticketTypeIds: event.saleDiscountTicketTypeIds,
        active: event.saleDiscountActive,
        endsAt: event.saleDiscountEndsAt
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'İndirim kaydedilemedi' },
      { status: 400 }
    );
  }
}
