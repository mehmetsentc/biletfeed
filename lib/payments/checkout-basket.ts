/** Aynı sepet + tutar için açık İyzico oturumunu tekrar kullanmak. */

export type CheckoutBasketLine = {
  ticketTypeId: string;
  quantity: number;
  seatUnitIds?: string[];
};

export function checkoutBasketKey(
  total: number,
  items: CheckoutBasketLine[]
): string {
  const lines = items
    .map((item) => {
      const seats = [...(item.seatUnitIds ?? [])].sort().join(',');
      return `${item.ticketTypeId}:${item.quantity}:${seats}`;
    })
    .sort();
  return `${total.toFixed(2)}|${lines.join('|')}`;
}
