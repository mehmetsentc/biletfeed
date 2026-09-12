/** İstemci sepet satırı — farklı gün/etkinlik biletlerini tek ödemede toplar */

export type CartLine = {
  /** İstemci tarafı satır anahtarı */
  key: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  /** ISO tarih — sepet gruplaması için */
  eventStartAt: string;
  eventCoverImage?: string | null;
  ticketTypeId: string;
  ticketTypeName: string;
  unitPrice: number;
  quantity: number;
  isBogo?: boolean;
  /** Koltuklu seçimde unit id listesi (quantity ile aynı uzunlukta olabilir) */
  seatUnitIds?: string[];
};

export type CartState = {
  version: 1;
  lines: CartLine[];
  updatedAt: string;
};

export const CART_STORAGE_KEY = 'bf-cart-v1';
export const CART_COOKIE_NAME = 'bf-cart-count';
export const CART_EVENT_NAME = 'bf-cart-change';

export const MAX_CART_LINES = 20;
export const MAX_CART_TICKETS = 30;
