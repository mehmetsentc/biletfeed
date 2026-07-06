import { createHmac, timingSafeEqual } from 'crypto';
import { PENDING_ORDER_TTL_MINUTES } from '@/lib/payments/config';

function getSecret(): string {
  const secret = process.env.TICKET_SECRET_KEY?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('TICKET_SECRET_KEY yapılandırılmamış');
  }
  return 'dev-secret-change-in-production';
}

/** Ödeme sayfasına misafir checkout sonrası güvenli erişim */
export function createPaymentAccessToken(orderId: string): string {
  const exp = Date.now() + PENDING_ORDER_TTL_MINUTES * 60 * 1000;
  const payload = `${orderId}:${exp}`;
  const sig = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${Buffer.from(payload, 'utf8').toString('base64url')}.${sig}`;
}

export function verifyPaymentAccessToken(orderId: string, token: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, sig] = parts;
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    return false;
  }

  const [tokenOrderId, expRaw] = payload.split(':');
  if (tokenOrderId !== orderId) return false;

  const exp = Number.parseInt(expRaw, 10);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const expected = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
