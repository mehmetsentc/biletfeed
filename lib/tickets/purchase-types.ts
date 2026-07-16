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
  /** Tek satın alımda üretilecek QR / kişi sayısı */
  seatsPerUnit: number;
  showLowStockBadge: boolean;
};

/**
 * Wizard bazen açıklamayı `name — açıklama` olarak name alanına yazar.
 * Görüntüleme için kısa ad + açıklamayı ayırır.
 */
export function splitTicketDisplay(
  name: string,
  description?: string | null
): { title: string; description: string } {
  const sep = ' — ';
  const idx = name.indexOf(sep);
  const title = (idx >= 0 ? name.slice(0, idx) : name).trim();
  const fromName = idx >= 0 ? name.slice(idx + sep.length).trim() : '';
  const fromField = description?.trim() ?? '';
  return {
    title: title || name.trim(),
    description: fromField || fromName
  };
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
