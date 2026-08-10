import Iyzipay from 'iyzipay';
import { prisma } from '@/lib/db/prisma';
import {
  getIyzicoBaseUrl,
  isIyzicoConfigured
} from '@/lib/payments/config';
import {
  PaymentNotConfiguredError,
  type PaymentInitInput,
  type PaymentInitResult,
  type PaymentProvider,
  type PaymentVerifyResult
} from '@/lib/payments/types';

/** Checkout TCKN toplamadığı için İyzico zorunlu alan placeholder */
const DEFAULT_IDENTITY = '11111111111';
const DEFAULT_ADDRESS = 'Türkiye';
const DEFAULT_CITY = 'Istanbul';
const DEFAULT_COUNTRY = 'Turkey';
const DEFAULT_PHONE = '+905000000000';

type IyzipayClient = InstanceType<typeof Iyzipay>;

function createClient(): IyzipayClient {
  return new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY!.trim(),
    secretKey: process.env.IYZICO_SECRET_KEY!.trim(),
    uri: getIyzicoBaseUrl()
  });
}

function formatPrice(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

function splitName(fullName: string | undefined): {
  name: string;
  surname: string;
} {
  const trimmed = (fullName ?? '').trim();
  if (!trimmed) return { name: 'Musteri', surname: 'BiletFeed' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { name: parts[0]!, surname: 'BiletFeed' };
  return {
    name: parts[0]!,
    surname: parts.slice(1).join(' ')
  };
}

function normalizePhone(phone: string | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length >= 10) {
    if (digits.startsWith('90')) return `+${digits}`;
    if (digits.startsWith('0')) return `+9${digits}`;
    return `+90${digits}`;
  }
  return DEFAULT_PHONE;
}

function promisifyCreate(
  client: IyzipayClient,
  request: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    client.checkoutFormInitialize.create(
      request as never,
      ((err: Error, result: unknown) => {
        if (err) reject(err);
        else resolve((result ?? {}) as Record<string, unknown>);
      }) as never
    );
  });
}

function promisifyRetrieve(
  client: IyzipayClient,
  request: { locale: string; conversationId?: string; token: string }
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    client.checkoutForm.retrieve(
      request as never,
      ((err: Error, result: unknown) => {
        if (err) reject(err);
        else resolve((result ?? {}) as Record<string, unknown>);
      }) as never
    );
  });
}

async function parseFormToken(request: Request): Promise<string | null> {
  const contentType = request.headers.get('content-type') ?? '';
  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await request.formData();
    const token = form.get('token');
    return typeof token === 'string' && token.trim() ? token.trim() : null;
  }
  try {
    const json = (await request.json()) as { token?: unknown };
    return typeof json.token === 'string' && json.token.trim()
      ? json.token.trim()
      : null;
  } catch {
    return null;
  }
}

export function buildIyzicoCheckoutRequest(
  input: PaymentInitInput
): Record<string, unknown> {
  const { name, surname } = splitName(input.buyer.name);
  const contactName = `${name} ${surname}`.trim();
  const price = formatPrice(input.amount);

  const basketItems = input.items.map((item) => {
    const lineTotal = formatPrice(item.price * item.quantity);
    return {
      id: item.id.slice(0, 64),
      name: item.name.slice(0, 200) || input.eventTitle.slice(0, 200),
      category1: 'Etkinlik',
      itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
      price: lineTotal
    };
  });

  // İyzico: basketItems fiyat toplamı === price
  const itemsSum = basketItems.reduce((s, i) => s + Number(i.price), 0);
  if (Math.abs(itemsSum - Number(price)) > 0.009 && basketItems.length > 0) {
    const last = basketItems[basketItems.length - 1]!;
    const adj =
      Math.round((Number(price) - (itemsSum - Number(last.price))) * 100) /
      100;
    last.price = formatPrice(adj);
  }

  if (basketItems.length === 0) {
    basketItems.push({
      id: input.orderId.slice(0, 64),
      name: input.eventTitle.slice(0, 200) || 'Bilet',
      category1: 'Etkinlik',
      itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
      price
    });
  }

  const address = {
    contactName,
    city: DEFAULT_CITY,
    country: DEFAULT_COUNTRY,
    address: DEFAULT_ADDRESS,
    zipCode: '34000'
  };

  return {
    locale: Iyzipay.LOCALE.TR,
    conversationId: input.orderId,
    price,
    paidPrice: price,
    currency: Iyzipay.CURRENCY.TRY,
    basketId: input.orderId,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: input.callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id: input.buyer.id.slice(0, 64),
      name,
      surname,
      gsmNumber: normalizePhone(input.buyer.phone),
      email: input.buyer.email,
      identityNumber: DEFAULT_IDENTITY,
      registrationAddress: DEFAULT_ADDRESS,
      city: DEFAULT_CITY,
      country: DEFAULT_COUNTRY,
      zipCode: '34000'
    },
    billingAddress: address,
    shippingAddress: address,
    basketItems
  };
}

export function mapIyzicoRetrieveToVerify(
  result: Record<string, unknown>,
  fallbackOrderId?: string
): PaymentVerifyResult {
  const conversationId =
    typeof result.conversationId === 'string'
      ? result.conversationId
      : typeof result.basketId === 'string'
        ? result.basketId
        : fallbackOrderId ?? '';

  const paymentId =
    result.paymentId != null ? String(result.paymentId) : '';

  const apiOk = String(result.status ?? '').toLowerCase() === 'success';
  const paymentStatus = String(result.paymentStatus ?? '').toUpperCase();
  const fraudStatus = Number(result.fraudStatus ?? 1);

  const paid =
    apiOk && paymentStatus === 'SUCCESS' && fraudStatus !== -1;

  const amountRaw = result.paidPrice ?? result.price;
  const amount =
    amountRaw != null && Number.isFinite(Number(amountRaw))
      ? Number(amountRaw)
      : undefined;

  return {
    valid: Boolean(conversationId) && (paid || paymentStatus === 'FAILURE'),
    orderId: conversationId,
    providerPaymentId: paymentId || `iyzico:${conversationId}`,
    status: paid ? 'paid' : 'failed',
    amount,
    currency:
      typeof result.currency === 'string' ? result.currency : 'TRY'
  };
}

export const iyzicoPaymentProvider: PaymentProvider = {
  name: 'iyzico',

  isConfigured() {
    return isIyzicoConfigured();
  },

  async createCheckoutSession(
    input: PaymentInitInput
  ): Promise<PaymentInitResult> {
    if (!this.isConfigured()) {
      throw new PaymentNotConfiguredError('iyzico');
    }

    const client = createClient();
    const request = buildIyzicoCheckoutRequest(input);
    const result = await promisifyCreate(client, request);

    if (String(result.status ?? '').toLowerCase() !== 'success') {
      const msg =
        typeof result.errorMessage === 'string'
          ? result.errorMessage
          : 'İyzico checkout başlatılamadı';
      throw new Error(msg);
    }

    const token =
      typeof result.token === 'string' ? result.token.trim() : '';
    const paymentPageUrl =
      typeof result.paymentPageUrl === 'string'
        ? result.paymentPageUrl.trim()
        : '';

    if (!token || !paymentPageUrl) {
      throw new Error('İyzico yanıtında token veya paymentPageUrl yok');
    }

    return {
      provider: 'iyzico',
      sessionId: token,
      checkoutUrl: paymentPageUrl
    };
  },

  async verifyCallback(request: Request): Promise<PaymentVerifyResult> {
    if (!this.isConfigured()) {
      throw new PaymentNotConfiguredError('iyzico');
    }

    const token = await parseFormToken(request);
    if (!token) {
      return {
        valid: false,
        orderId: '',
        providerPaymentId: '',
        status: 'failed'
      };
    }

    const client = createClient();
    const result = await promisifyRetrieve(client, {
      locale: Iyzipay.LOCALE.TR,
      token
    });

    const preliminary = mapIyzicoRetrieveToVerify(result);
    if (preliminary.orderId) return preliminary;

    const order = await prisma.order.findFirst({
      where: { paymentSessionId: token },
      select: { id: true }
    });
    return mapIyzicoRetrieveToVerify(result, order?.id);
  }
};
