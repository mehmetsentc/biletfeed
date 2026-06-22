import { getPaymentProviderName } from '@/lib/payments/config';
import { iyzicoPaymentProvider } from '@/lib/payments/providers/iyzico';
import { mockPaymentProvider } from '@/lib/payments/providers/mock';
import { paytrPaymentProvider } from '@/lib/payments/providers/paytr';
import { stripePaymentProvider } from '@/lib/payments/providers/stripe';
import type { PaymentProvider, PaymentProviderName } from '@/lib/payments/types';

const providers: Record<PaymentProviderName, PaymentProvider | undefined> = {
  free: mockPaymentProvider,
  mock: mockPaymentProvider,
  iyzico: iyzicoPaymentProvider,
  paytr: paytrPaymentProvider,
  stripe: stripePaymentProvider
};

export function getPaymentProvider(
  name: PaymentProviderName = getPaymentProviderName()
): PaymentProvider {
  const provider = providers[name];
  if (!provider) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Ödeme sağlayıcısı yapılandırılmamış: ${name}`);
    }
    return mockPaymentProvider;
  }
  return provider;
}
