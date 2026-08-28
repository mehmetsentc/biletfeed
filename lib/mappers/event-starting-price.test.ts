import { describe, expect, it } from 'vitest';
import { resolvePublicStartingPrice } from '@/lib/mappers/event';

describe('resolvePublicStartingPrice', () => {
  it('returns 0 for free events', () => {
    expect(
      resolvePublicStartingPrice({
        isFree: true,
        basePrice: 0,
        ticketTypes: [{ price: 0, status: 'active' }]
      })
    ).toBe(0);
  });

  it('ignores zero-price invite types and paused VIP', () => {
    expect(
      resolvePublicStartingPrice({
        isFree: false,
        basePrice: 0,
        ticketTypes: [
          { price: 0, status: 'active' },
          { price: 4500, status: 'paused' },
          { price: 1500, status: 'active' },
          { price: 3500, status: 'active' }
        ]
      })
    ).toBe(1500);
  });

  it('falls back to basePrice when no paid tickets', () => {
    expect(
      resolvePublicStartingPrice({
        isFree: false,
        basePrice: 1200,
        ticketTypes: [{ price: 0, status: 'active' }]
      })
    ).toBe(1200);
  });
});
