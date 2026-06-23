import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import {
  getEventTicketTypes,
  listPendingOrdersForEvent
} from '@/lib/services/event-invitations';

export async function GET(request: NextRequest) {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get('eventId');
  if (!eventId) {
    return NextResponse.json({ error: 'eventId gerekli' }, { status: 400 });
  }

  const [ticketTypes, pendingOrders] = await Promise.all([
    getEventTicketTypes(eventId, ctx.organizer.id),
    listPendingOrdersForEvent(ctx.organizer.id, eventId)
  ]);

  return NextResponse.json({
    ticketTypes,
    pendingOrders: pendingOrders.map((order) => ({
      id: order.id,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      expiresAt: order.expiresAt?.toISOString() || null,
      buyerName: order.user.displayName,
      buyerEmail: order.user.email,
      items: order.items.map((item) => ({
        name: item.ticketType.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    }))
  });
}
