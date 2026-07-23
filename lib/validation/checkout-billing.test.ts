import { describe, expect, it } from 'vitest';
import {
  checkoutBillingSchema,
  validateCheckoutBilling
} from '@/lib/validation/checkout-billing';

describe('checkoutBillingSchema B2C', () => {
  it('accepts individual with no tax id (nihai tüketici)', () => {
    const parsed = checkoutBillingSchema.safeParse({
      isCorporate: false,
      companyName: '',
      taxNumber: '',
      taxOffice: '',
      billingAddress: ''
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.isCorporate).toBe(false);
      expect(parsed.data.taxNumber).toBeUndefined();
      expect(parsed.data.taxOffice).toBeUndefined();
    }
  });

  it('strips leftover tax id when not corporate', () => {
    const parsed = checkoutBillingSchema.safeParse({
      isCorporate: false,
      taxNumber: '12345678901',
      taxOffice: 'Kadıköy',
      companyName: 'Someone'
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.taxNumber).toBeUndefined();
      expect(parsed.data.taxOffice).toBeUndefined();
    }
  });

  it('requires VKN + unvan for corporate', () => {
    const bad = validateCheckoutBilling({
      isCorporate: true,
      companyName: '',
      taxNumber: '123',
      taxOffice: '',
      billingAddress: ''
    });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(bad.errors.companyName).toBeTruthy();
      expect(bad.errors.taxNumber).toBeTruthy();
    }

    const good = validateCheckoutBilling({
      isCorporate: true,
      companyName: 'ABC Organizasyon Ltd. Şti.',
      taxNumber: '1234567890',
      taxOffice: 'Kadıköy',
      billingAddress: 'Caferağa Mah. Moda Cad. No:1 Kadıköy İstanbul'
    });
    expect(good.success).toBe(true);
    if (good.success) {
      expect(good.data.taxNumber).toBe('1234567890');
      expect(good.data.isCorporate).toBe(true);
    }
  });
});
