import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import {
  getEventTicketTypes,
  listPendingOrdersForEvent
} from '@/lib/services/event-invitations';
import { getSoldSeatUnitIds } from '@/lib/tickets/purchase-context';
import {
  getEventSeatPlanForOrganizer,
  listAvailableSeatsForTicketType,
  requiresSeatAssignment
} from '@/lib/tickets/seat-inventory';

export async function GET(request: NextRequest) {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get('eventId');
  if (!eventId) {
    return NextResponse.json({ error: 'eventId gerekli' }, { status: 400 });
  }

  const [ticketTypes, pendingOrders, seatPlan, soldSeatIds] = await Promise.all([
    getEventTicketTypes(eventId, ctx.organizer.id),
    listPendingOrdersForEvent(ctx.organizer.id, eventId),
    getEventSeatPlanForOrganizer(eventId, ctx.organizer.id),
    getSoldSeatUnitIds(eventId).catch(() => [] as string[])
  ]);

  const needsSeats = requiresSeatAssignment(seatPlan);
  const availableSeatsByTicketType: Record<
    string,
    Array<{ id: string; label: string; zoneCode: string; zoneLabel: string }>
  > = {};

  if (needsSeats && seatPlan) {
    await Promise.all(
      ticketTypes.map(async (tt) => {
        availableSeatsByTicketType[tt.id] = await listAvailableSeatsForTicketType({
          eventId,
          ticketType: {
            id: tt.id,
            name: tt.name,
            description: null
          },
          seatPlan,
          soldSeatIds
        });
      })
    );
  }

  return NextResponse.json({
    ticketTypes,
    requiresSeatSelection: needsSeats,
    soldSeatIds: needsSeats ? soldSeatIds : [],
    availableSeatsByTicketType,
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
