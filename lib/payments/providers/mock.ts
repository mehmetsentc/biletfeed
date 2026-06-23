import { getAppBaseUrl } from '@/lib/payments/config';
import { isMockPaymentAllowed } from '@/lib/payments/config';
import type {
  PaymentInitInput,
  PaymentInitResult,
  PaymentProvider,
  PaymentVerifyResult
} from '@/lib/payments/types';

function verifyMockCallbackAuth(request: Request): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const secret =
    process.env.MOCK_PAYMENT_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();
  if (!secret) return true;

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
}

export const mockPaymentProvider: PaymentProvider = {
  name: 'mock',

  isConfigured() {
    return true;
  },

  async createCheckoutSession(input: PaymentInitInput): Promise<PaymentInitResult> {
    const sessionId = `mock_sess_${input.orderId}`;
    const base = getAppBaseUrl();
    return {
      provider: 'mock',
      sessionId,
      checkoutUrl: `${base}/odeme/islem/${input.orderId}?session=${encodeURIComponent(sessionId)}`
    };
  },

  async verifyCallback(request: Request): Promise<PaymentVerifyResult> {
    if (!isMockPaymentAllowed()) {
      return { valid: false, orderId: '', providerPaymentId: '', status: 'failed' };
    }

    if (!verifyMockCallbackAuth(request)) {
      return { valid: false, orderId: '', providerPaymentId: '', status: 'failed' };
    }

    const body = (await request.json().catch(() => ({}))) as {
      orderId?: string;
      sessionId?: string;
      status?: string;
      amount?: number;
      currency?: string;
    };

    const orderId = body.orderId || '';
    const status = body.status === 'paid' ? 'paid' : 'failed';

    return {
      valid: Boolean(orderId),
      orderId,
      providerPaymentId: body.sessionId || `mock_${Date.now()}`,
      status,
      amount: body.amount,
      currency: body.currency || 'TRY'
    };
  }
};
