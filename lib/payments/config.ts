import type { PaymentProviderName } from '@/lib/payments/types';

export const PENDING_ORDER_TTL_MINUTES = 15;

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function getPaymentProviderName(): PaymentProviderName {
  const fallback =
    process.env.NODE_ENV === 'production' ? 'iyzico' : 'mock';
  const raw = (process.env.PAYMENT_PROVIDER || fallback).toLowerCase();
  if (
    raw === 'free' ||
    raw === 'mock' ||
    raw === 'iyzico' ||
    raw === 'paytr' ||
    raw === 'stripe'
  ) {
    return raw;
  }
  return fallback;
}

export function isMockPaymentAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  if (process.env.ENABLE_MOCK_PAYMENTS === 'false') {
    return false;
  }
  return getPaymentProviderName() === 'mock';
}

/** Production deploy öncesi mock ödeme bayrağını reddeder */
export function assertProductionPaymentConfig(): void {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ENABLE_MOCK_PAYMENTS === 'true'
  ) {
    throw new Error(
      'ENABLE_MOCK_PAYMENTS production ortamında kullanılamaz'
    );
  }
}

export function isIyzicoConfigured(): boolean {
  return Boolean(
    process.env.IYZICO_API_KEY?.trim() &&
      process.env.IYZICO_SECRET_KEY?.trim()
  );
}

export function isPaytrConfigured(): boolean {
  return Boolean(
    process.env.PAYTR_MERCHANT_ID?.trim() &&
      process.env.PAYTR_MERCHANT_KEY?.trim() &&
      process.env.PAYTR_MERCHANT_SALT?.trim()
  );
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function isPaymentProviderConfigured(
  provider: PaymentProviderName = getPaymentProviderName()
): boolean {
  if (provider === 'free' || provider === 'mock') return true;
  if (provider === 'iyzico') return isIyzicoConfigured();
  if (provider === 'paytr') return isPaytrConfigured();
  if (provider === 'stripe') return isStripeConfigured();
  return false;
}
