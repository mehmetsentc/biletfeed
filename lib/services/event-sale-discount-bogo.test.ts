import { describe, expect, it } from 'vitest';
import {
  bogoPaidQuantity,
  effectiveTicketPrice,
  lineSubtotalForQuantity
} from '@/lib/services/event-sale-discount';

describe('bogo campaign', () => {
  const event = {
    isFree: false,
    saleDiscountActive: true,
    saleDiscountPercent: null as number | null,
    saleDiscountTicketTypeIds: [] as string[],
    saleDiscountEndsAt: null as Date | null,
    saleCampaignType: 'bogo'
  };

  it('paid quantity is ceil(qty/2)', () => {
    expect(bogoPaidQuantity(1)).toBe(1);
    expect(bogoPaidQuantity(2)).toBe(1);
    expect(bogoPaidQuantity(3)).toBe(2);
    expect(bogoPaidQuantity(4)).toBe(2);
  });

  it('charges half seats for even qty', () => {
    const ticket = { id: 't1', price: 1000 };
    expect(lineSubtotalForQuantity(event, ticket, 2)).toBe(1000);
    expect(lineSubtotalForQuantity(event, ticket, 4)).toBe(2000);
    expect(lineSubtotalForQuantity(event, ticket, 3)).toBe(2000);
  });

  it('marks ticket as bogo on sale', () => {
    const eff = effectiveTicketPrice(event, { id: 't1', price: 1500 });
    expect(eff.isBogo).toBe(true);
    expect(eff.unitPrice).toBe(1500);
    expect(eff.isOnSale).toBe(true);
  });
});
