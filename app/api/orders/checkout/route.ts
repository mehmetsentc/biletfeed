import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { createCheckout } from '@/lib/services/orders';
import { rateLimitOrNullAsync } from '@/lib/security/rate-limit';
import { checkoutAttendeeSchema } from '@/lib/validation/checkout-attendee';
import { checkoutBillingSchema } from '@/lib/validation/checkout-billing';

const bodySchema = checkoutAttendeeSchema.extend({
  eventSlug: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  ticketTypeId: z.string().uuid().optional(),
  couponCode: z.string().max(50).optional(),
  billing: checkoutBillingSchema.optional()
});

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimitOrNullAsync(request, 'checkout', 15, 60_000);
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
        { error: first?.message ?? 'Geçersiz katılımcı bilgileri' },
        { status: 400 }
      );
    }

    const result = await createCheckout({
      firebaseUid: session?.uid,
      eventSlug: parsed.data.eventSlug,
      quantity: parsed.data.quantity,
      ticketTypeId: parsed.data.ticketTypeId,
      attendeeName: parsed.data.attendeeName,
      attendeeEmail: parsed.data.attendeeEmail,
      attendeePhone: parsed.data.attendeePhone,
      couponCode: parsed.data.couponCode,
      billing: parsed.data.billing
    });

    // redirectUrl ödeme sağlayıcısından gelir (Tosla, Iyzico vb.) —
    // harici domain olabilir, same-origin kontrolü yapılmaz.
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sipariş oluşturulamadı';
    console.error('[checkout] error:', message, err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
