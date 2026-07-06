import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { verifyPaymentAccessToken } from '@/lib/payments/payment-access-token';
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

export type PaymentPageAccess =
  | { type: 'form'; context: PaymentPageContext }
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

/** @deprecated resolvePaymentPageAccess kullanın */
export async function getPaymentPageContext(params: {
  orderId: string;
  firebaseUid?: string;
  accessToken?: string;
}): Promise<PaymentPageContext | null> {
  const result = await resolvePaymentPageAccess(params);
  return result.type === 'form' ? result.context : null;
}
