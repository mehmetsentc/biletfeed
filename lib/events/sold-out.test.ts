import { describe, expect, it } from 'vitest';
import {
  excludeSoldOutHomeEvents,
  isEventPubliclySoldOut
} from '@/lib/events/sold-out';

describe('isEventPubliclySoldOut', () => {
  it('is false when there are no ticket types', () => {
    expect(isEventPubliclySoldOut({ isFree: false, ticketTypes: [] })).toBe(false);
  });

  it('is false when an active paid type still has stock', () => {
    expect(
      isEventPubliclySoldOut({
        isFree: false,
        ticketTypes: [
          { price: 1000, status: 'active', sold: 4, capacity: 100 },
          { price: 0, status: 'active', sold: 0, capacity: 50 }
        ]
      })
    ).toBe(false);
  });

  it('is true when every public type is sold out or paused', () => {
    expect(
      isEventPubliclySoldOut({
        isFree: false,
        ticketTypes: [
          { price: 1000, status: 'sold_out', sold: 100, capacity: 100 },
          { price: 2500, status: 'paused', sold: 0, capacity: 20 }
        ]
      })
    ).toBe(true);
  });

  it('is true when capacity is filled even if status is still active', () => {
    expect(
      isEventPubliclySoldOut({
        isFree: false,
        ticketTypes: [{ price: 1000, status: 'active', sold: 80, capacity: 80 }]
      })
    ).toBe(true);
  });

  it('is true when only invitation (0₺) types remain on a paid event', () => {
    expect(
      isEventPubliclySoldOut({
        isFree: false,
        ticketTypes: [{ price: 0, status: 'active', sold: 2, capacity: 50 }]
      })
    ).toBe(true);
  });

  it('is true when remaining stock is invitation-only even if priced', () => {
    expect(
      isEventPubliclySoldOut({
        isFree: false,
        ticketTypes: [
          {
            price: 0,
            status: 'active',
            sold: 2,
            capacity: 50,
            invitationOnly: true,
            type: 'invitation',
            name: 'Davetiye'
          }
        ]
      })
    ).toBe(true);
  });

  it('is false for a free event with remaining active stock', () => {
    expect(
      isEventPubliclySoldOut({
        isFree: true,
        ticketTypes: [{ price: 0, status: 'active', sold: 10, capacity: 40 }]
      })
    ).toBe(false);
  });
});

describe('excludeSoldOutHomeEvents', () => {
  it('drops events marked sold out', () => {
    expect(
      excludeSoldOutHomeEvents([
        { id: 'a', isSoldOut: false },
        { id: 'b', isSoldOut: true },
        { id: 'c' }
      ]).map((e) => e.id)
    ).toEqual(['a', 'c']);
  });
});
