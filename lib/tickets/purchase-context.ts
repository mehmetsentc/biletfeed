import { getEventBySlug } from '@/lib/services/events';
import { getCheckoutTicketTypes } from '@/lib/services/orders';
import { isExternalListing } from '@/lib/events/ticket-url';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';
import type { SeatPlan } from '@/lib/services/organizer-panel';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getSoldAndHeldSeatUnitIds } from '@/lib/tickets/seat-hold';

export type { CheckoutTicketType } from '@/lib/tickets/purchase-types';

/** VALID/USED biletler + süresi dolmamış checkout kilitleri */
export async function getSoldSeatUnitIds(eventId: string): Promise<string[]> {
  return getSoldAndHeldSeatUnitIds(eventId);
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
    isBogo: tt.isBogo ?? false,
    allowsZeroPrice: tt.allowsZeroPrice ?? false,
    status: tt.status ?? 'active'
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
