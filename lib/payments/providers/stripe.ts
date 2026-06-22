import { isStripeConfigured } from '@/lib/payments/config';
import {
  PaymentNotConfiguredError,
  type PaymentInitInput,
  type PaymentInitResult,
  type PaymentProvider,
  type PaymentVerifyResult
} from '@/lib/payments/types';

/** Stripe — secret key eklendiğinde implement edilecek. */
export const stripePaymentProvider: PaymentProvider = {
  name: 'stripe',

  isConfigured() {
    return isStripeConfigured();
  },

  async createCheckoutSession(_input: PaymentInitInput): Promise<PaymentInitResult> {
    if (!this.isConfigured()) {
      throw new PaymentNotConfiguredError('stripe');
    }
    throw new Error('Stripe entegrasyonu henüz tamamlanmadı');
  },

  async verifyCallback(_request: Request): Promise<PaymentVerifyResult> {
    if (!this.isConfigured()) {
      throw new PaymentNotConfiguredError('stripe');
    }
    throw new Error('Stripe webhook doğrulaması henüz implement edilmedi');
  }
};
