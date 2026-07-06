export type PaymentProviderName =
  | 'free'
  | 'mock'
  | 'iyzico'
  | 'paytr'
  | 'stripe'
  | 'tosla';

export interface PaymentBuyer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
}

export interface PaymentLineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PaymentInitInput {
  orderId: string;
  amount: number;
  currency: 'TRY';
  buyer: PaymentBuyer;
  items: PaymentLineItem[];
  eventTitle: string;
  successUrl: string;
  failureUrl: string;
  callbackUrl: string;
}

export interface PaymentInitResult {
  provider: PaymentProviderName;
  sessionId: string;
  /** Ödeme sayfası URL — kart bilgisi bizde toplanmaz (Tosla: BiletFeed kart sayfası) */
  checkoutUrl: string;
  /** Tosla ortak ödeme sayfası — yedek */
  hostedFallbackUrl?: string;
  processCardFormUrl?: string;
}

export interface PaymentCallbackPayload {
  provider: PaymentProviderName;
  orderId: string;
  providerPaymentId: string;
  sessionId?: string;
  status: 'paid' | 'failed' | 'cancelled';
  raw?: unknown;
}

export interface PaymentVerifyResult {
  valid: boolean;
  orderId: string;
  providerPaymentId: string;
  status: 'paid' | 'failed' | 'cancelled';
  /** Provider doğrulamasından gelen tutar (callback'te siparişle karşılaştırılır) */
  amount?: number;
  currency?: string;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  isConfigured(): boolean;
  createCheckoutSession(input: PaymentInitInput): Promise<PaymentInitResult>;
  verifyCallback(
    request: Request,
    payload?: unknown
  ): Promise<PaymentVerifyResult>;
}

export class PaymentNotConfiguredError extends Error {
  constructor(provider: PaymentProviderName) {
    super(
      `${provider} ödeme sağlayıcısı henüz yapılandırılmadı. API anahtarlarını .env dosyasına ekleyin.`
    );
    this.name = 'PaymentNotConfiguredError';
  }
}
