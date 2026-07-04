import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { isAllowedAppRedirectUrl } from '@/lib/auth/safe-redirect';
import { verifySessionCookie } from '@/lib/auth/session';
import { createCheckout } from '@/lib/services/orders';
import { getAppBaseUrl } from '@/lib/payments/config';
import { rateLimitOrNullAsync } from '@/lib/security/rate-limit';
import { checkoutAttendeeSchema } from '@/lib/validation/checkout-attendee';

const bodySchema = checkoutAttendeeSchema.extend({
  eventSlug: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  ticketTypeId: z.string().uuid().optional(),
  couponCode: z.string().max(50).optional()
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
      couponCode: parsed.data.couponCode
    });

    const allowedOrigins = [getAppBaseUrl()];
    if (
      result.redirectUrl &&
      !isAllowedAppRedirectUrl(result.redirectUrl, allowedOrigins)
    ) {
      return NextResponse.json({ error: 'Geçersiz ödeme yönlendirmesi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ error: 'Sipariş oluşturulamadı' }, { status: 400 });
  }
}
