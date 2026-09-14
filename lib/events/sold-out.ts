import { publicTicketInventoryAvailable } from '@/lib/tickets/purchase-types';

export type PublicTicketInventory = {
  price: number;
  status?: string | null;
  sold?: number | null;
  capacity?: number | null;
};

function normalizeTicketStatus(
  status: string | null | undefined
): 'active' | 'paused' | 'sold_out' {
  if (status === 'paused' || status === 'sold_out') return status;
  return 'active';
}

export function isPublicTicketTypeAvailable(
  type: PublicTicketInventory,
  isFree: boolean
): boolean {
  return publicTicketInventoryAvailable({
    status: normalizeTicketStatus(type.status),
    capacity: type.capacity ?? 0,
    sold: type.sold ?? 0,
    price: type.price,
    allowsZeroPrice: isFree
  });
}

/**
 * Kamuya satılacak bilet kalmadıysa true (tükendi / duraklatıldı / davetiye-only).
 * Bilet türü yoksa tükendi sayılmaz — henüz envanter tanımlı olmayabilir.
 */
export function isEventPubliclySoldOut(event: {
  isFree: boolean;
  ticketTypes: PublicTicketInventory[];
}): boolean {
  if (event.ticketTypes.length === 0) return false;
  return !event.ticketTypes.some((type) =>
    isPublicTicketTypeAvailable(type, event.isFree)
  );
}

export function excludeSoldOutHomeEvents<T extends { isSoldOut?: boolean }>(
  events: T[]
): T[] {
  return events.filter((event) => !event.isSoldOut);
}
