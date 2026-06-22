import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { getOrderForUser } from '@/lib/services/orders';

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  const { orderId } = await params;
  const order = await getOrderForUser({
    orderId,
    firebaseUid: session.uid
  });

  if (!order) {
    return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    total: order.total,
    provider: order.paymentProvider,
    paidAt: order.paidAt,
    expiresAt: order.expiresAt,
    ticketCount: order.purchasedTickets.length,
    event: order.event
  });
}
