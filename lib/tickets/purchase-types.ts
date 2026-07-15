/** Client-safe bilet satın alma tipleri — sunucu modülleri import etmez */

export type CheckoutTicketType = {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  currency: string;
  capacity: number;
  sold: number;
  showLowStockBadge: boolean;
};

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
