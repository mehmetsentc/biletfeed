/** Client-safe bilet satın alma tipleri — sunucu modülleri import etmez */

export type CheckoutTicketType = {
  id: string;
  name: string;
  description: string;
  type: string;
  /** Efektif satış birim fiyatı (indirimliyse indirimli) */
  price: number;
  /** Liste / eski fiyat — indirimde üstü çizilir */
  listPrice: number;
  isOnSale: boolean;
  discountPercent: number | null;
  currency: string;
  capacity: number;
  sold: number;
  /** Tek satın alımda üretilecek QR / kişi sayısı */
  seatsPerUnit: number;
  showLowStockBadge: boolean;
  /**
   * Etkinlik ücretsizse price=0 satın alınabilir.
   * Ücretli etkinlikte price=0 = satış dışı (VIP kaldırma vb.) — “Ücretsiz” değil.
   */
  allowsZeroPrice: boolean;
};

/**
 * Eski kayıtlarda açıklama `name — açıklama` olarak name'e yazılmış olabilir.
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
  if (type.capacity - type.sold <= 0) return false;
  // Ücretli etkinlikte 0₺ = satış kaldırıldı; ücretsiz etkinlik hariç
  if (type.price <= 0 && !type.allowsZeroPrice) return false;
  return true;
}

export function ticketTypeRemaining(type: CheckoutTicketType): number {
  if (type.price <= 0 && !type.allowsZeroPrice) return 0;
  return Math.max(0, type.capacity - type.sold);
}

/** Kategori / sepet fiyat satırı — satış dışı ile gerçek ücretsizi ayır */
export function ticketTypeAvailabilityLabel(
  type: CheckoutTicketType,
  labels: { free: string; unavailable: string; soldOut: string }
): string | null {
  if (type.price <= 0 && !type.allowsZeroPrice) return labels.unavailable;
  if (type.capacity - type.sold <= 0) return labels.soldOut;
  if (type.price <= 0) return labels.free;
  return null;
}
