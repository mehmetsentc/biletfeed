import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { createOrganizerRefundRequest } from '@/lib/services/bank-refund';
import { processOrderRefund } from '@/lib/services/order-refund';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

const bodySchema = z.object({
  orderId: z.string().uuid(),
  action: z.enum(['request_refund', 'cancel_tickets']),
  reason: z.string().max(500).optional(),
  ticketIds: z.array(z.string().uuid()).optional()
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek kaynağı' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const limited = rateLimitOrNull(
    request,
    `org-refund:${ctx.organizer.id}`,
    20,
    60_000
  );
  if (limited) return limited;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  try {
    const { prisma } = await import('@/lib/db/prisma');
    const order = await prisma.order.findFirst({
      where: {
        id: parsed.data.orderId,
        organizerId: ctx.organizer.id,
        deletedAt: null
      },
      select: { id: true }
    });
    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    if (parsed.data.action === 'cancel_tickets') {
      const result = await processOrderRefund({
        orderId: parsed.data.orderId,
        reason: parsed.data.reason ?? 'Organizatör bilet iptali',
        ticketIds: parsed.data.ticketIds,
        cancelOnly: true,
        actorId: ctx.user.id
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: result.message });
    }

    const id = await createOrganizerRefundRequest({
      orderId: parsed.data.orderId,
      organizerId: ctx.organizer.id,
      reason: parsed.data.reason,
      ticketIds: parsed.data.ticketIds,
      requestedBy: ctx.user.id
    });

    return NextResponse.json({
      success: true,
      message: 'İade talebi oluşturuldu — admin onayı bekleniyor',
      requestId: id
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'İşlem başarısız' },
      { status: 400 }
    );
  }
}
