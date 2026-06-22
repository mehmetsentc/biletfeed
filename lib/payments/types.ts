export type PaymentProviderName =
  | 'free'
  | 'mock'
  | 'iyzico'
  | 'paytr'
  | 'stripe';

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
  /** Hosted ödeme sayfası — kart bilgisi bizde toplanmaz */
  checkoutUrl: string;
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
