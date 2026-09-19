import { describe, expect, it } from 'vitest';
import { pickCouponForEvent } from '@/lib/services/coupons';

describe('pickCouponForEvent', () => {
  it('etkinliğe özel kuponu tüm etkinlikler kuponuna tercih eder', () => {
    const picked = pickCouponForEvent(
      [
        { id: 'global', eventId: null },
        { id: 'oct4', eventId: 'event-4ekim' }
      ],
      'event-4ekim'
    );
    expect(picked?.id).toBe('oct4');
  });

  it('yalnızca tüm etkinlikler kuponu varsa onu kullanır', () => {
    const picked = pickCouponForEvent(
      [{ id: 'global', eventId: null }],
      'event-4ekim'
    );
    expect(picked?.id).toBe('global');
  });

  it('başka etkinliğe tanımlı kuponu uygulamaz', () => {
    const picked = pickCouponForEvent(
      [{ id: 'oct3', eventId: 'event-3ekim' }],
      'event-4ekim'
    );
    expect(picked).toBeUndefined();
  });
});
