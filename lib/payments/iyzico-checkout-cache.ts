import { getRedisClient } from '@/lib/redis';
import { PENDING_ORDER_TTL_MINUTES } from '@/lib/payments/config';

export type IyzicoCheckoutCachePayload = {
  token: string;
  paymentPageUrl: string;
  /** İyzico checkoutFormContent — ham veya base64 */
  checkoutFormContent?: string;
};

const memory = new Map<string, { payload: IyzicoCheckoutCachePayload; exp: number }>();

function key(orderId: string): string {
  return `iyzico:checkout:${orderId}`;
}

function ttlSeconds(): number {
  return PENDING_ORDER_TTL_MINUTES * 60;
}

export async function cacheIyzicoCheckout(
  orderId: string,
  payload: IyzicoCheckoutCachePayload
): Promise<void> {
  const exp = Date.now() + ttlSeconds() * 1000;
  memory.set(orderId, { payload, exp });

  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.set(key(orderId), JSON.stringify(payload), { ex: ttlSeconds() });
  } catch {
    // Redis opsiyonel — bellek yedeği yeterli (tek instance / kısa süre)
  }
}

export async function readIyzicoCheckout(
  orderId: string
): Promise<IyzicoCheckoutCachePayload | null> {
  const mem = memory.get(orderId);
  if (mem) {
    if (Date.now() > mem.exp) {
      memory.delete(orderId);
    } else {
      return mem.payload;
    }
  }

  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(key(orderId));
    if (!raw) return null;
    const parsed =
      typeof raw === 'string' ? (JSON.parse(raw) as IyzicoCheckoutCachePayload) : raw;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.token === 'string' &&
      typeof parsed.paymentPageUrl === 'string'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

/** checkoutFormContent bazen Base64 gelir */
export function decodeIyzicoCheckoutFormContent(raw: string): string {
  const trimmed = raw.trim();
  if (
    trimmed.includes('iyziInit') ||
    trimmed.includes('iyzipay') ||
    trimmed.startsWith('<')
  ) {
    return trimmed;
  }
  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
    if (decoded.includes('iyziInit') || decoded.includes('iyzipay') || decoded.includes('<')) {
      return decoded;
    }
  } catch {
    // ignore
  }
  return trimmed;
}

export function withIyzicoIframeParam(paymentPageUrl: string): string {
  try {
    const url = new URL(paymentPageUrl);
    url.searchParams.set('iframe', 'true');
    return url.toString();
  } catch {
    const join = paymentPageUrl.includes('?') ? '&' : '?';
    return `${paymentPageUrl}${join}iframe=true`;
  }
}
