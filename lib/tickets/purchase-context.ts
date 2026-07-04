import { getEventBySlug } from '@/lib/services/events';
import { getCheckoutTicketTypes } from '@/lib/services/orders';
import { isExternalListing } from '@/lib/events/ticket-url';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';

export type { CheckoutTicketType } from '@/lib/tickets/purchase-types';

export async function getTicketPurchaseContext(eventSlug: string) {
  const event = await getEventBySlug(eventSlug);
  if (!event) return null;

  if (isExternalListing(event)) {
    return { event, ticketTypes: [] as CheckoutTicketType[], external: true as const };
  }

  const ticketTypes = await getCheckoutTicketTypes(eventSlug);
  return { event, ticketTypes, external: false as const };
}
