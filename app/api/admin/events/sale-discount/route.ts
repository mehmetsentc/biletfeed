import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { setEventSaleDiscount } from '@/lib/services/event-sale-discount';

const bodySchema = z.object({
  eventId: z.string().uuid(),
  campaignType: z.enum(['percent', 'bogo']).optional(),
  percent: z.number().int().min(1).max(100).nullable().optional(),
  active: z.boolean(),
  ticketTypeIds: z.array(z.string().uuid()).optional(),
  endsAt: z.string().datetime().nullable().optional()
});

export async function PATCH(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'events.manage');
  if ('error' in guard) return guard.error;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  try {
    const event = await setEventSaleDiscount({
      eventId: parsed.data.eventId,
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
