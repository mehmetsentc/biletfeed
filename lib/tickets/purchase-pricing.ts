export type PurchasePricing = {
  quantity: number;
  unitPrice: number;
  ticketSubtotal: number;
  subtotal: number;
  discount: number;
  total: number;
};

/** Müşteriye gösterilen fiyat: organizatörün girdiği bilet fiyatı (hizmet bedeli dahil, ayrı satır yok) */
export function calculatePurchasePricing(params: {
  unitPrice: number;
  quantity: number;
  discount?: number;
  /** 1 alana 1 bedava — ücretli adet = ceil(qty/2) */
  isBogo?: boolean;
}): PurchasePricing {
  const quantity = Math.min(Math.max(params.quantity, 1), 10);
  const unitPrice = params.unitPrice;
  const chargeQty = params.isBogo ? Math.ceil(quantity / 2) : quantity;
  const ticketSubtotal = Math.round(unitPrice * chargeQty * 100) / 100;
  const discount = Math.max(0, params.discount ?? 0);
  const total = Math.max(0, Math.round((ticketSubtotal - discount) * 100) / 100);

  return {
    quantity,
    unitPrice,
    ticketSubtotal,
    subtotal: ticketSubtotal,
    discount,
    total
  };
}

export function formatTry(amount: number): string {
  if (amount <= 0) return 'Ücretsiz';
  return `${amount.toLocaleString('tr-TR')} ₺`;
}
