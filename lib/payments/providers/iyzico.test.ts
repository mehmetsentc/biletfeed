import { describe, expect, it } from 'vitest';
import {
  buildIyzicoCheckoutRequest,
  mapIyzicoRetrieveToVerify
} from '@/lib/payments/providers/iyzico';
import type { PaymentInitInput } from '@/lib/payments/types';

const baseInput: PaymentInitInput = {
  orderId: 'ord-uuid-1234',
  amount: 120,
  currency: 'TRY',
  buyer: {
    id: 'user-1',
    email: 'ali@example.com',
    name: 'Ali Veli',
    phone: '05321234567'
  },
  items: [
    { id: 'tt-1', name: 'Genel', price: 60, quantity: 2 }
  ],
  eventTitle: 'Test Konser',
  successUrl: 'https://biletfeed.com/ok',
  failureUrl: 'https://biletfeed.com/fail',
  callbackUrl: 'https://biletfeed.com/api/payments/callback/iyzico'
};

describe('buildIyzicoCheckoutRequest', () => {
  it('maps order fields for Checkout Form initialize', () => {
    const req = buildIyzicoCheckoutRequest(baseInput);
    expect(req.conversationId).toBe('ord-uuid-1234');
    expect(req.basketId).toBe('ord-uuid-1234');
    expect(req.price).toBe('120.00');
    expect(req.paidPrice).toBe('120.00');
    expect(req.callbackUrl).toContain('/callback/iyzico');
    expect(req.buyer).toMatchObject({
      name: 'Ali',
      surname: 'Veli',
      email: 'ali@example.com',
      identityNumber: '11111111111'
    });
    const items = req.basketItems as Array<{ price: string; itemType: string }>;
    expect(items).toHaveLength(1);
    expect(items[0]!.price).toBe('120.00');
    expect(items[0]!.itemType).toBe('VIRTUAL');
  });

  it('creates a single basket line when items empty', () => {
    const req = buildIyzicoCheckoutRequest({ ...baseInput, items: [] });
    const items = req.basketItems as Array<{ price: string; name: string }>;
    expect(items).toHaveLength(1);
    expect(items[0]!.price).toBe('120.00');
    expect(items[0]!.name).toContain('Test Konser');
  });
});

describe('mapIyzicoRetrieveToVerify', () => {
  it('maps SUCCESS payment to paid', () => {
    const result = mapIyzicoRetrieveToVerify({
      status: 'success',
      paymentStatus: 'SUCCESS',
      fraudStatus: 1,
      conversationId: 'ord-1',
      paymentId: '987654',
      paidPrice: '120.00',
      currency: 'TRY'
    });
    expect(result).toMatchObject({
      valid: true,
      orderId: 'ord-1',
      providerPaymentId: '987654',
      status: 'paid',
      amount: 120,
      currency: 'TRY'
    });
  });

  it('maps FAILURE payment to failed', () => {
    const result = mapIyzicoRetrieveToVerify({
      status: 'success',
      paymentStatus: 'FAILURE',
      conversationId: 'ord-2',
      paymentId: '1'
    });
    expect(result.status).toBe('failed');
    expect(result.valid).toBe(true);
    expect(result.orderId).toBe('ord-2');
  });

  it('uses fallback order id when conversation missing', () => {
    const result = mapIyzicoRetrieveToVerify(
      {
        status: 'success',
        paymentStatus: 'SUCCESS',
        paymentId: '9'
      },
      'fallback-order'
    );
    expect(result.orderId).toBe('fallback-order');
    expect(result.status).toBe('paid');
  });
});
