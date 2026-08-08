import { getEventBySlug } from '@/lib/services/events';
import { getCheckoutTicketTypes } from '@/lib/services/orders';
import { isExternalListing } from '@/lib/events/ticket-url';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';
import type { SeatPlan } from '@/lib/services/organizer-panel';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { parseSectionSeatUnitId } from '@/lib/tickets/seat-packages';

export type { CheckoutTicketType } from '@/lib/tickets/purchase-types';

async function getSoldSeatUnitIds(eventId: string): Promise<string[]> {
  await ensureDbConnection();
  const tickets = await prisma.purchasedTicket.findMany({
    where: {
      eventId,
      status: { in: ['VALID', 'USED'] },
      deletedAt: null
    },
    select: { attendeeName: true },
    take: 20000
  });
  const ids: string[] = [];
  for (const t of tickets) {
    const name = t.attendeeName ?? '';
    const fromParse = parseSectionSeatUnitId(name);
    if (fromParse) {
      ids.push(fromParse);
      continue;
    }
    const m = name.match(/·\s*([A-Z0-9-]{2,16})\s*$/i);
    if (m?.[1]) ids.push(m[1].toUpperCase());
  }
  return ids;
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
    seatsPerUnit: Math.max(1, tt.seatsPerUnit ?? 1)
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
