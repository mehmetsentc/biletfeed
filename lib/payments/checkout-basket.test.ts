import { describe, expect, it } from 'vitest';
import { checkoutBasketKey } from '@/lib/payments/checkout-basket';

describe('checkoutBasketKey', () => {
  it('matches the same basket regardless of line order', () => {
    const a = checkoutBasketKey(150, [
      { ticketTypeId: 'b', quantity: 1 },
      { ticketTypeId: 'a', quantity: 2, seatUnitIds: ['s2', 's1'] }
    ]);
    const b = checkoutBasketKey(150, [
      { ticketTypeId: 'a', quantity: 2, seatUnitIds: ['s1', 's2'] },
      { ticketTypeId: 'b', quantity: 1 }
    ]);
    expect(a).toBe(b);
  });

  it('differs when quantity, seats, or total change', () => {
    const base = checkoutBasketKey(100, [
      { ticketTypeId: 'a', quantity: 1, seatUnitIds: ['s1'] }
    ]);
    expect(
      checkoutBasketKey(100, [{ ticketTypeId: 'a', quantity: 2, seatUnitIds: ['s1'] }])
    ).not.toBe(base);
    expect(
      checkoutBasketKey(100, [{ ticketTypeId: 'a', quantity: 1, seatUnitIds: ['s2'] }])
    ).not.toBe(base);
    expect(
      checkoutBasketKey(90, [{ ticketTypeId: 'a', quantity: 1, seatUnitIds: ['s1'] }])
    ).not.toBe(base);
  });
});
