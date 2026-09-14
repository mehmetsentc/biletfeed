import { describe, expect, it } from 'vitest';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';
import { filterAvailableCheckoutTicketTypes } from '@/lib/tickets/purchase-types';

function type(
  overrides: Partial<CheckoutTicketType> & Pick<CheckoutTicketType, 'id'>
): CheckoutTicketType {
  return {
    name: overrides.id,
    description: '',
    type: 'general',
    price: 1000,
    listPrice: 1000,
    isOnSale: false,
    discountPercent: null,
    isBogo: false,
    currency: 'TRY',
    capacity: 100,
    sold: 0,
    seatsPerUnit: 1,
    showLowStockBadge: false,
    status: 'active',
    allowsZeroPrice: false,
    ...overrides
  };
}

describe('filterAvailableCheckoutTicketTypes', () => {
  it('hides sold_out, paused, and full-capacity types', () => {
    const visible = filterAvailableCheckoutTicketTypes([
      type({ id: 'open', sold: 4, capacity: 100 }),
      type({ id: 'sold', status: 'sold_out', sold: 100, capacity: 100 }),
      type({ id: 'full', status: 'active', sold: 80, capacity: 80 }),
      type({ id: 'paused', status: 'paused', sold: 0, capacity: 20 })
    ]);
    expect(visible.map((t) => t.id)).toEqual(['open']);
  });

  it('hides zero-price invitation types on paid events', () => {
    const visible = filterAvailableCheckoutTicketTypes([
      type({ id: 'paid', price: 1500 }),
      type({ id: 'invite', price: 0, allowsZeroPrice: false })
    ]);
    expect(visible.map((t) => t.id)).toEqual(['paid']);
  });
});
