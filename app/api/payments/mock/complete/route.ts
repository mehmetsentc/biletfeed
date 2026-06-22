import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { isMockPaymentAllowed } from '@/lib/payments/config';
import { verifySessionCookie } from '@/lib/auth/session';
import {
  failPendingOrder,
  fulfillPaidOrder,
  getOrderForUser
} from '@/lib/services/orders';

const bodySchema = z.object({
  orderId: z.string().uuid(),
  sessionId: z.string().optional(),
  status: z.enum(['paid', 'failed'])
});

/** Geliştirme ortamında mock ödeme simülasyonu */
export async function POST(request: NextRequest) {
  if (!isMockPaymentAllowed()) {
    return NextResponse.json({ error: 'Mock ödeme kapalı' }, { status: 403 });
  }

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

  const order = await getOrderForUser({
    orderId: parsed.data.orderId,
    firebaseUid: session.uid
  });
  if (!order || order.status !== 'pending') {
    return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
  }

  try {
    if (parsed.data.status === 'paid') {
      const result = await fulfillPaidOrder({
        orderId: parsed.data.orderId,
        provider: 'mock',
        providerPaymentId: parsed.data.sessionId || `mock_${Date.now()}`
      });
      return NextResponse.json({ success: true, ...result });
    }

    await failPendingOrder({
      orderId: parsed.data.orderId,
      provider: 'mock',
      providerPaymentId: parsed.data.sessionId
    });

    return NextResponse.json({ success: false, status: 'failed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'İşlem başarısız';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
