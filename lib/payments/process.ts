import { withTransientRetry } from '@/lib/http/public-error';
import { getPaymentProvider } from '@/lib/payments/provider';
import type {
  PaymentInitInput,
  PaymentInitResult,
  PaymentProviderName,
  PaymentVerifyResult
} from '@/lib/payments/types';

export type { PaymentInitInput, PaymentInitResult, PaymentVerifyResult };

export async function startPaymentCheckout(
  input: PaymentInitInput,
  providerName?: PaymentProviderName
): Promise<PaymentInitResult> {
  const provider = getPaymentProvider(providerName);
  if (!provider.isConfigured()) {
    throw new Error(
      `${provider.name} ödeme sağlayıcısı yapılandırılmamış. Ortam değişkenlerini kontrol edin.`
    );
  }
  return withTransientRetry(() => provider.createCheckoutSession(input), {
    retries: 2,
    delayMs: 400
  });
}

export async function verifyPaymentCallback(
  providerName: PaymentProviderName,
  request: Request
): Promise<PaymentVerifyResult> {
  const provider = getPaymentProvider(providerName);
  return provider.verifyCallback(request);
}
