import { getEventBySlug } from '@/lib/services/events';
import { getCheckoutTicketTypes } from '@/lib/services/orders';
import { isExternalListing } from '@/lib/events/ticket-url';

export type CheckoutTicketType = Awaited<
  ReturnType<typeof getCheckoutTicketTypes>
>[number];

export async function getTicketPurchaseContext(eventSlug: string) {
  const event = await getEventBySlug(eventSlug);
  if (!event) return null;

  if (isExternalListing(event)) {
    return { event, ticketTypes: [] as CheckoutTicketType[], external: true as const };
  }

  const ticketTypes = await getCheckoutTicketTypes(eventSlug);
  return { event, ticketTypes, external: false as const };
}

export function findTicketType(
  ticketTypes: CheckoutTicketType[],
  ticketTypeId: string
): CheckoutTicketType | undefined {
  return ticketTypes.find((t) => t.id === ticketTypeId);
}

export function ticketTypeAvailable(type: CheckoutTicketType): boolean {
  return type.capacity - type.sold > 0;
}

export function ticketTypeRemaining(type: CheckoutTicketType): number {
  return Math.max(0, type.capacity - type.sold);
}
