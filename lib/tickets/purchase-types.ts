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
  /** 1 alana 1 bedava kampanyası */
  isBogo: boolean;
  currency: string;
  capacity: number;
  sold: number;
  /**
   * Tek satın alımda üretilecek QR sayısı.
   * Masa/loca paketlerinde kişi sayısı. Kombine bilette günler aynı QR ile check-in olur.
   */
  seatsPerUnit: number;
  showLowStockBadge: boolean;
  /** active | paused | sold_out — tükendi / duraklatılanlar satın alma listesinde gizlenir */
  status: 'active' | 'paused' | 'sold_out';
  /**
   * Etkinlik ücretsizse price=0 satın alınabilir.
   * Ücretli etkinlikte price=0 = satış dışı (VIP kaldırma vb.) — “Ücretsiz” değil.
   */
  allowsZeroPrice: boolean;
  /** Satışa kapalı davetiye kontenjanı */
  invitationOnly?: boolean;
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

export function isInvitationTicketName(name: string): boolean {
  const normalized = name
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i');
  return (
    normalized.includes('davetiye') ||
    normalized.includes('invitation') ||
    normalized.includes('invite')
  );
}

/** Checkout’ta asla satılmaz — davetiye paneli kontenjanı */
export function isSalesClosedTicketType(type: {
  invitationOnly?: boolean | null;
  type?: string | null;
  name?: string | null;
}): boolean {
  if (type.invitationOnly) return true;
  if (type.type === 'invitation') return true;
  if (type.name && isInvitationTicketName(type.name)) return true;
  return false;
}

export function publicTicketInventoryAvailable(type: {
  status: 'active' | 'paused' | 'sold_out';
  capacity: number;
  sold: number;
  price: number;
  allowsZeroPrice: boolean;
  invitationOnly?: boolean | null;
  type?: string | null;
  name?: string | null;
}): boolean {
  if (isSalesClosedTicketType(type)) return false;
  if (type.status !== 'active') return false;
  if (type.capacity - type.sold <= 0) return false;
  // Ücretli etkinlikte 0₺ = satış kaldırıldı; ücretsiz etkinlik hariç
  if (type.price <= 0 && !type.allowsZeroPrice) return false;
  return true;
}

export function ticketTypeAvailable(type: CheckoutTicketType): boolean {
  return publicTicketInventoryAvailable(type);
}

export function filterAvailableCheckoutTicketTypes(
  ticketTypes: CheckoutTicketType[]
): CheckoutTicketType[] {
  return ticketTypes.filter(ticketTypeAvailable);
}

export function ticketTypeRemaining(type: CheckoutTicketType): number {
  if (type.status !== 'active') return 0;
  if (type.price <= 0 && !type.allowsZeroPrice) return 0;
  return Math.max(0, type.capacity - type.sold);
}

/** Adında kombine/combo geçen paket bilet (çok gün, tek QR, gün bazlı check-in) */
export function isComboTicketName(name: string): boolean {
  // tr-TR: ASCII "I" → "ı"; eşleşme için ı→i normalize et
  const normalized = name
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i');
  return (
    normalized.includes('kombine') ||
    normalized.includes('combo') ||
    normalized.includes('combined')
  );
}

/**
 * seatsPerUnit > 1 rozeti:
 * - Kombine → "Kombine bilet" (kişi değil)
 * - Masa/loca → "X kişi / QR"
 */
export function seatsPerUnitBadgeLabel(
  name: string,
  seatsPerUnit: number
): string | null {
  const seats = Math.max(1, seatsPerUnit || 1);
  if (isComboTicketName(name)) {
    return seats <= 1 ? 'Kombine bilet' : `Kombine · ${seats} kişi`;
  }
  if (seats <= 1) return null;
  return `${seats} kişi / QR`;
}

/** Checkout özet satırı — kombine vs kişi paketi */
export function seatsPerUnitSummaryLabel(name: string): string {
  return isComboTicketName(name) ? 'Kombine (tek QR)' : 'QR / kişi';
}

/** Kategori / sepet fiyat satırı — satış dışı ile gerçek ücretsizi ayır */
export function ticketTypeAvailabilityLabel(
  type: CheckoutTicketType,
  labels: { free: string; unavailable: string; soldOut: string }
): string | null {
  if (isSalesClosedTicketType(type)) return labels.unavailable;
  if (type.status === 'sold_out' || type.status === 'paused') return labels.soldOut;
  if (type.price <= 0 && !type.allowsZeroPrice) return labels.unavailable;
  if (type.capacity - type.sold <= 0) return labels.soldOut;
  if (type.price <= 0) return labels.free;
  return null;
}
