import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { createCartCheckout } from '@/lib/services/cart-checkout';
import { rateLimitOrNullAsync } from '@/lib/security/rate-limit';
import { checkoutAttendeeSchema } from '@/lib/validation/checkout-attendee';
import { checkoutBillingSchema } from '@/lib/validation/checkout-billing';

const cartItemSchema = z.object({
  eventSlug: z.string().min(1),
  quantity: z.number().int().min(1).max(10).default(1),
  ticketTypeId: z.string().uuid().optional(),
  ticketTypeIds: z.array(z.string().uuid()).min(1).max(10).optional(),
  seatUnitIds: z.array(z.string().min(1).max(24)).min(1).max(10).optional()
});

const bodySchema = checkoutAttendeeSchema.extend({
  items: z.array(cartItemSchema).min(1).max(15),
  billing: checkoutBillingSchema.optional()
});

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimitOrNullAsync(
      request,
      'cart-checkout',
      10,
      60_000
    );
    if (limited) return limited;

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
    }

    const session = await verifySessionCookie();
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? 'Geçersiz sepet bilgileri' },
        { status: 400 }
      );
    }

    for (const item of parsed.data.items) {
      if (!item.ticketTypeId && !(item.ticketTypeIds?.length)) {
        return NextResponse.json(
          { error: 'Her satır için bilet tipi gerekli' },
          { status: 400 }
        );
      }
    }

    const result = await createCartCheckout({
      firebaseUid: session?.uid,
      items: parsed.data.items,
      attendeeName: parsed.data.attendeeName,
      attendeeEmail: parsed.data.attendeeEmail,
      attendeePhone: parsed.data.attendeePhone,
      billing: parsed.data.billing
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Sepet ödemesi oluşturulamadı';
    console.error('[cart-checkout] error:', message, err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
