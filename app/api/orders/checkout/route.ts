import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifySessionCookie } from '@/lib/auth/session';
import { checkoutEvent } from '@/lib/services/orders';

const bodySchema = z.object({
  eventSlug: z.string().min(1),
  quantity: z.number().int().min(1).max(10)
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionCookie();
    if (!session) {
      return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const result = await checkoutEvent({
      firebaseUid: session.uid,
      eventSlug: parsed.data.eventSlug,
      quantity: parsed.data.quantity
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Sipariş oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
