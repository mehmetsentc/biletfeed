import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { verifyPaymentAccessToken } from '@/lib/payments/payment-access-token';
import {
  decodeIyzicoCheckoutFormContent,
  readIyzicoCheckout,
  withIyzicoIframeParam
} from '@/lib/payments/iyzico-checkout-cache';
import { getIyzicoBaseUrl } from '@/lib/payments/config';
import {
  getToslaHostedPaymentUrl,
  getToslaProcessCardFormUrl
} from '@/lib/payments/tosla-urls';

export type PaymentPageContext = {
  orderId: string;
  total: number;
  currency: string;
  eventTitle: string;
  eventSlug: string;
  coverImage: string | null;
  ticketSummary: string;
  sessionId: string;
  processCardFormUrl: string;
  hostedPaymentUrl: string;
  cancelUrl: string;
};

export type IyzicoPaymentPageContext = {
  orderId: string;
  total: number;
  currency: string;
  eventTitle: string;
  eventSlug: string;
  coverImage: string | null;
  ticketSummary: string;
  sessionId: string;
  /** İyzico CPP iframe URL (&iframe=true) */
  iframeUrl: string;
  /** Responsive gömülü form HTML (varsa) */
  checkoutFormHtml: string | null;
  /** Hosted sayfa — iframe engellenirse yedek */
  hostedPaymentUrl: string;
  cancelUrl: string;
  expiresAt: string | null;
};

export type PaymentPageAccess =
  | { type: 'form'; context: PaymentPageContext }
  | { type: 'paid'; orderId: string }
  | { type: 'denied' };

export type IyzicoPaymentPageAccess =
  | { type: 'form'; context: IyzicoPaymentPageContext }
  | { type: 'paid'; orderId: string }
  | { type: 'denied' };

async function resolveOrderAccess(params: {
  orderId: string;
  firebaseUid?: string;
  accessToken?: string;
}): Promise<{ userId: string | null; tokenOk: boolean }> {
  let userId: string | null = null;

  if (params.firebaseUid) {
    const user = await prisma.user.findFirst({
      where: { firebaseUid: params.firebaseUid, deletedAt: null },
      select: { id: true }
    });
    if (user) userId = user.id;
  }

  const tokenOk = Boolean(
    params.accessToken && verifyPaymentAccessToken(params.orderId, params.accessToken)
  );

  return { userId, tokenOk };
}

export async function resolvePaymentPageAccess(params: {
  orderId: string;
  firebaseUid?: string;
  accessToken?: string;
}): Promise<PaymentPageAccess> {
  await ensureDbConnection();

  const { userId, tokenOk } = await resolveOrderAccess(params);
  if (!userId && !tokenOk) return { type: 'denied' };

  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      deletedAt: null,
      ...(userId ? { userId } : {})
    },
    include: {
      event: { select: { title: true, slug: true, coverImage: true } },
      items: { include: { ticketType: { select: { name: true } } } }
    }
  });

  if (!order) return { type: 'denied' };
  if (order.status === 'paid') return { type: 'paid', orderId: order.id };
  if (order.status !== 'pending') return { type: 'denied' };
  if (order.paymentProvider !== 'tosla') return { type: 'denied' };
  if (!order.paymentSessionId) return { type: 'denied' };

  const ticketSummary = order.items
    .map((item) => `${item.ticketType.name} ×${item.quantity}`)
    .join(', ');

  return {
    type: 'form',
    context: {
      orderId: order.id,
      total: order.total,
      currency: 'TRY',
      eventTitle: order.event.title,
      eventSlug: order.event.slug,
      coverImage: order.event.coverImage,
      ticketSummary,
      sessionId: order.paymentSessionId,
      processCardFormUrl: getToslaProcessCardFormUrl(),
      hostedPaymentUrl: getToslaHostedPaymentUrl(order.paymentSessionId),
      cancelUrl: `/etkinlik/${order.event.slug}/bilet`
    }
  };
}

export async function resolveIyzicoPaymentPageAccess(params: {
  orderId: string;
  firebaseUid?: string;
  accessToken?: string;
}): Promise<IyzicoPaymentPageAccess> {
  await ensureDbConnection();

  const { userId, tokenOk } = await resolveOrderAccess(params);
  if (!userId && !tokenOk) return { type: 'denied' };

  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      deletedAt: null,
      ...(userId ? { userId } : {})
    },
    include: {
      event: { select: { title: true, slug: true, coverImage: true } },
      items: { include: { ticketType: { select: { name: true } } } }
    }
  });

  if (!order) return { type: 'denied' };
  if (order.status === 'paid') return { type: 'paid', orderId: order.id };
  if (order.status !== 'pending') return { type: 'denied' };
  if (order.paymentProvider !== 'iyzico') return { type: 'denied' };
  if (!order.paymentSessionId) return { type: 'denied' };

  if (order.expiresAt && order.expiresAt.getTime() < Date.now()) {
    return { type: 'denied' };
  }

  const cached = await readIyzicoCheckout(order.id);
  const cppBase = getIyzicoBaseUrl().includes('sandbox')
    ? 'https://sandbox-cpp.iyzipay.com'
    : 'https://cpp.iyzipay.com';
  const hostedPaymentUrl =
    cached?.paymentPageUrl ??
    `${cppBase}/?token=${encodeURIComponent(order.paymentSessionId)}`;
  const iframeUrl = withIyzicoIframeParam(hostedPaymentUrl);

  const checkoutFormHtml = cached?.checkoutFormContent
    ? decodeIyzicoCheckoutFormContent(cached.checkoutFormContent)
    : null;

  const ticketSummary = order.items
    .map((item) => `${item.ticketType.name} ×${item.quantity}`)
    .join(', ');

  return {
    type: 'form',
    context: {
      orderId: order.id,
      total: order.total,
      currency: 'TRY',
      eventTitle: order.event.title,
      eventSlug: order.event.slug,
      coverImage: order.event.coverImage,
      ticketSummary,
      sessionId: order.paymentSessionId,
      iframeUrl,
      checkoutFormHtml,
      hostedPaymentUrl,
      cancelUrl: `/etkinlik/${order.event.slug}/bilet`,
      expiresAt: order.expiresAt?.toISOString() ?? null
    }
  };
}

/** @deprecated resolvePaymentPageAccess kullanın */
export async function getPaymentPageContext(params: {
  orderId: string;
  firebaseUid?: string;
  accessToken?: string;
}): Promise<PaymentPageContext | null> {
  const access = await resolvePaymentPageAccess(params);
  return access.type === 'form' ? access.context : null;
}
