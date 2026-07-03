import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { rateLimitOrNullAsync } from '@/lib/security/rate-limit';
import { validateCoupon } from '@/lib/services/coupons';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

const bodySchema = z.object({
  code: z.string().min(1).max(50),
  eventSlug: z.string().min(1),
  quantity: z.number().int().min(1).max(10).default(1),
  ticketTypeId: z.string().uuid().optional()
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const limited = await rateLimitOrNullAsync(request, 'coupons-validate', 30, 60_000);
  if (limited) return limited;

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  await ensureDbConnection();
  const event = await prisma.event.findFirst({
    where: { slug: parsed.data.eventSlug, status: 'published', deletedAt: null },
    select: { id: true, organizerId: true, ticketTypes: { where: { status: 'active', deletedAt: null } } }
  });
  if (!event) {
    return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 });
  }

  const ticketType =
    (parsed.data.ticketTypeId
      ? event.ticketTypes.find((t) => t.id === parsed.data.ticketTypeId)
      : undefined) ?? event.ticketTypes[0];
  if (!ticketType) {
    return NextResponse.json({ error: 'Bilet türü bulunamadı' }, { status: 400 });
  }

  const subtotal = ticketType.price * parsed.data.quantity;

  try {
    const result = await validateCoupon({
      code: parsed.data.code,
      eventId: event.id,
      organizerId: event.organizerId,
      subtotal
    });
    return NextResponse.json({
      valid: true,
      code: result.code,
      discount: result.discount,
      type: result.type,
      total: Math.max(0, subtotal - result.discount)
    });
  } catch (e) {
    return NextResponse.json(
      { valid: false, error: e instanceof Error ? e.message : 'Geçersiz kupon' },
      { status: 400 }
    );
  }
}
