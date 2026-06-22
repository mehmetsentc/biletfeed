import { isIyzicoConfigured } from '@/lib/payments/config';
import {
  PaymentNotConfiguredError,
  type PaymentInitInput,
  type PaymentInitResult,
  type PaymentProvider,
  type PaymentVerifyResult
} from '@/lib/payments/types';

/** iyzico — API anahtarları eklendiğinde createCheckoutSession implement edilecek. */
export const iyzicoPaymentProvider: PaymentProvider = {
  name: 'iyzico',

  isConfigured() {
    return isIyzicoConfigured();
  },

  async createCheckoutSession(_input: PaymentInitInput): Promise<PaymentInitResult> {
    if (!this.isConfigured()) {
      throw new PaymentNotConfiguredError('iyzico');
    }
    throw new Error('iyzico entegrasyonu henüz tamamlanmadı — şirket onayı sonrası aktif edilecek');
  },

  async verifyCallback(_request: Request): Promise<PaymentVerifyResult> {
    if (!this.isConfigured()) {
      throw new PaymentNotConfiguredError('iyzico');
    }
    throw new Error('iyzico callback doğrulaması henüz implement edilmedi');
  }
};
