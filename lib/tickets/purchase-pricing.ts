/** Platform hizmet bedeli — bilet fiyatına dahil gösterim oranı */
export const PLATFORM_SERVICE_FEE_RATE = 0.1;

export type PurchasePricing = {
  quantity: number;
  unitPrice: number;
  ticketSubtotal: number;
  serviceFee: number;
  subtotal: number;
  discount: number;
  total: number;
};

export function calculatePurchasePricing(params: {
  unitPrice: number;
  quantity: number;
  discount?: number;
  serviceFeeRate?: number;
}): PurchasePricing {
  const quantity = Math.min(Math.max(params.quantity, 1), 10);
  const unitPrice = params.unitPrice;
  const subtotal = Math.round(unitPrice * quantity * 100) / 100;
  const rate = params.serviceFeeRate ?? PLATFORM_SERVICE_FEE_RATE;
  const ticketSubtotal = Math.round((subtotal / (1 + rate)) * 100) / 100;
  const serviceFee = Math.round((subtotal - ticketSubtotal) * 100) / 100;
  const discount = Math.max(0, params.discount ?? 0);
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  return {
    quantity,
    unitPrice,
    ticketSubtotal,
    serviceFee,
    subtotal,
    discount,
    total
  };
}

export function formatTry(amount: number): string {
  if (amount <= 0) return 'Ücretsiz';
  return `${amount.toLocaleString('tr-TR')} ₺`;
}
