import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { isAllowedAppRedirectUrl } from '@/lib/auth/safe-redirect';
import { verifySessionCookie } from '@/lib/auth/session';
import { createCheckout } from '@/lib/services/orders';
import { getAppBaseUrl } from '@/lib/payments/config';
import { rateLimitOrNull } from '@/lib/security/rate-limit';

const bodySchema = z.object({
  eventSlug: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  ticketTypeId: z.string().uuid().optional(),
  attendeeName: z.string().min(2).max(120).optional(),
  attendeeEmail: z.string().email().optional()
});

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimitOrNull(request, 'checkout', 15, 60_000);
    if (limited) return limited;

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
    }

    const session = await verifySessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const result = await createCheckout({
      firebaseUid: session.uid,
      eventSlug: parsed.data.eventSlug,
      quantity: parsed.data.quantity,
      ticketTypeId: parsed.data.ticketTypeId,
      attendeeName: parsed.data.attendeeName,
      attendeeEmail: parsed.data.attendeeEmail
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
