import { getEventBySlug } from '@/lib/services/events';
import { getCheckoutTicketTypes } from '@/lib/services/orders';
import { isExternalListing } from '@/lib/events/ticket-url';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';
import type { SeatPlan } from '@/lib/services/organizer-panel';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export type { CheckoutTicketType } from '@/lib/tickets/purchase-types';

export async function getTicketPurchaseContext(eventSlug: string) {
  const event = await getEventBySlug(eventSlug);
  if (!event) return null;

  if (isExternalListing(event)) {
    return {
      event,
      ticketTypes: [] as CheckoutTicketType[],
      seatPlan: null as SeatPlan | null,
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
    select: { venue: { select: { seatPlan: true } } }
  });
  const rawPlan = venue?.venue?.seatPlan;
  const seatPlan =
    rawPlan && typeof rawPlan === 'object' && !Array.isArray(rawPlan)
      ? (rawPlan as SeatPlan)
      : null;

  return { event, ticketTypes: normalizedTypes, seatPlan, external: false as const };
}
