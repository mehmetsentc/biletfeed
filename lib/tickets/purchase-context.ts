import { getEventBySlug } from '@/lib/services/events';
import { getCheckoutTicketTypes } from '@/lib/services/orders';
import { isExternalListing } from '@/lib/events/ticket-url';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';
import type { SeatPlan } from '@/lib/services/organizer-panel';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { extractSeatUnitId } from '@/lib/tickets/seat-label';

export type { CheckoutTicketType } from '@/lib/tickets/purchase-types';

/** VALID/USED biletlerden satılmış koltuk id listesi */
export async function getSoldSeatUnitIds(eventId: string): Promise<string[]> {
  await ensureDbConnection();
  const tickets = await prisma.purchasedTicket.findMany({
    where: {
      eventId,
      status: { in: ['VALID', 'USED'] },
      deletedAt: null
    },
    select: { attendeeName: true, seatUnitId: true },
    take: 20000
  });
  const ids = new Set<string>();
  for (const t of tickets) {
    const id = extractSeatUnitId({
      seatUnitId: t.seatUnitId,
      attendeeName: t.attendeeName
    });
    if (id) ids.add(id);
  }
  return [...ids];
}

export async function getTicketPurchaseContext(eventSlug: string) {
  const event = await getEventBySlug(eventSlug);
  if (!event) return null;

  if (isExternalListing(event)) {
    return {
      event,
      ticketTypes: [] as CheckoutTicketType[],
      seatPlan: null as SeatPlan | null,
      soldSeatIds: [] as string[],
      external: true as const
    };
  }

  const ticketTypes = await getCheckoutTicketTypes(eventSlug);
  const normalizedTypes = ticketTypes.map((tt) => ({
    ...tt,
    seatsPerUnit: Math.max(1, tt.seatsPerUnit ?? 1),
    listPrice: tt.listPrice ?? tt.price,
    isOnSale: tt.isOnSale ?? false,
    discountPercent: tt.discountPercent ?? null,
    allowsZeroPrice: tt.allowsZeroPrice ?? false
  }));

  await ensureDbConnection();
  const venue = await prisma.event.findFirst({
    where: { slug: eventSlug, deletedAt: null },
    select: { id: true, venue: { select: { seatPlan: true } } }
  });
  const rawPlan = venue?.venue?.seatPlan;
  const seatPlan =
    rawPlan && typeof rawPlan === 'object' && !Array.isArray(rawPlan)
      ? (rawPlan as SeatPlan)
      : null;

  const soldSeatIds = venue?.id ? await getSoldSeatUnitIds(venue.id) : [];

  return {
    event,
    ticketTypes: normalizedTypes,
    seatPlan,
    soldSeatIds,
    external: false as const
  };
}
