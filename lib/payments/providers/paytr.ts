import { isPaytrConfigured } from '@/lib/payments/config';
import {
  PaymentNotConfiguredError,
  type PaymentInitInput,
  type PaymentInitResult,
  type PaymentProvider,
  type PaymentVerifyResult
} from '@/lib/payments/types';

/** PayTR — merchant bilgileri eklendiğinde implement edilecek. */
export const paytrPaymentProvider: PaymentProvider = {
  name: 'paytr',

  isConfigured() {
    return isPaytrConfigured();
  },

  async createCheckoutSession(_input: PaymentInitInput): Promise<PaymentInitResult> {
    if (!this.isConfigured()) {
      throw new PaymentNotConfiguredError('paytr');
    }
    throw new Error('PayTR entegrasyonu henüz tamamlanmadı — şirket onayı sonrası aktif edilecek');
  },

  async verifyCallback(_request: Request): Promise<PaymentVerifyResult> {
    if (!this.isConfigured()) {
      throw new PaymentNotConfiguredError('paytr');
    }
    throw new Error('PayTR callback doğrulaması henüz implement edilmedi');
  }
};
