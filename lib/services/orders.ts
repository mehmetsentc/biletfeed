import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import {
  generateTicketCode,
  generateValidationToken,
  newTicketId
} from '@/lib/tickets/sign';
import {
  getAppBaseUrl,
  getPaymentProviderName,
  PENDING_ORDER_TTL_MINUTES
} from '@/lib/payments/config';
import { startPaymentCheckout } from '@/lib/payments/process';
import type { PaymentProviderName } from '@/lib/payments/types';

export interface CheckoutResult {
  orderId: string;
  status: 'pending' | 'paid';
  ticketCount?: number;
  redirectUrl?: string;
  provider: PaymentProviderName;
}

function pendingExpiresAt(): Date {
  return new Date(Date.now() + PENDING_ORDER_TTL_MINUTES * 60 * 1000);
}

async function loadCheckoutContext(params: {
  firebaseUid: string;
  eventSlug: string;
  quantity: number;
}) {
  await ensureDbConnection();

  const user = await prisma.user.findFirst({
    where: { firebaseUid: params.firebaseUid, deletedAt: null }
  });
  if (!user) throw new Error('Kullanıcı bulunamadı');

  const event = await prisma.event.findFirst({
    where: { slug: params.eventSlug, status: 'published', deletedAt: null },
    include: {
      organizer: true,
      ticketTypes: {
        where: { status: 'active', deletedAt: null },
        orderBy: { price: 'asc' },
        take: 1
      }
    }
  });
  if (!event) throw new Error('Etkinlik bulunamadı');

  if (event.listingType === 'external') {
    throw new Error(
      'Bu etkinlik harici bir platformdadır. Bilet için kaynak siteye yönlendirilmelisiniz.'
    );
  }

  const ticketType = event.ticketTypes[0];
  if (!ticketType) throw new Error('Aktif bilet türü bulunamadı');

  const qty = Math.min(Math.max(params.quantity, 1), 10);
  if (ticketType.sold + qty > ticketType.capacity) {
    throw new Error('Yeterli bilet kalmadı');
  }

  const subtotal = ticketType.price * qty;
  const commissionRate = event.organizer.commissionRate ?? 0.1;
  const commission = Math.round(subtotal * commissionRate * 100) / 100;

  return { user, event, ticketType, qty, subtotal, commission };
}

export async function createCheckout(params: {
  firebaseUid: string;
  eventSlug: string;
  quantity: number;
}): Promise<CheckoutResult> {
  const { user, event, ticketType, qty, subtotal, commission } =
    await loadCheckoutContext(params);

  if (subtotal <= 0 || event.isFree) {
    const orderId = await fulfillFreeOrder({
      userId: user.id,
      eventId: event.id,
      organizerId: event.organizerId,
      ticketTypeId: ticketType.id,
      quantity: qty,
      unitPrice: ticketType.price
    });
    return {
      orderId,
      status: 'paid',
      ticketCount: qty,
      provider: 'free'
    };
  }

  const providerName = getPaymentProviderName();
  const base = getAppBaseUrl();

  const order = await prisma.$transaction(async (tx) => {
    const freshType = await tx.ticketType.findUnique({
      where: { id: ticketType.id }
    });
    if (!freshType || freshType.sold + qty > freshType.capacity) {
      throw new Error('Yeterli bilet kalmadı');
    }

    return tx.order.create({
      data: {
        userId: user.id,
        eventId: event.id,
        organizerId: event.organizerId,
        subtotal,
        commission,
        total: subtotal,
        status: 'pending',
        paymentProvider: providerName,
        expiresAt: pendingExpiresAt(),
        items: {
          create: {
            ticketTypeId: ticketType.id,
            quantity: qty,
            unitPrice: ticketType.price
          }
        }
      },
      include: { items: true }
    });
  });

  await prisma.transaction.create({
    data: {
      orderId: order.id,
      organizerId: event.organizerId,
      amount: subtotal,
      status: 'pending',
      provider: providerName
    }
  });

  const payment = await startPaymentCheckout({
    orderId: order.id,
    amount: subtotal,
    currency: 'TRY',
    buyer: {
      id: user.id,
      email: user.email,
      name: user.displayName || undefined
    },
    items: order.items.map((item) => ({
      id: item.ticketTypeId,
      name: ticketType.name,
      price: item.unitPrice,
      quantity: item.quantity
    })),
    eventTitle: event.title,
    successUrl: `${base}/odeme/basarili?order=${order.id}`,
    failureUrl: `${base}/odeme/basarisiz?order=${order.id}`,
    callbackUrl: `${base}/api/payments/callback/${providerName}`
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentSessionId: payment.sessionId }
  });

  return {
    orderId: order.id,
    status: 'pending',
    redirectUrl: payment.checkoutUrl,
    provider: payment.provider
  };
}

async function fulfillFreeOrder(params: {
  userId: string;
  eventId: string;
  organizerId: string;
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
}): Promise<string> {
  const subtotal = params.unitPrice * params.quantity;

  const order = await prisma.$transaction(async (tx) => {
    const ticketType = await tx.ticketType.findUnique({
      where: { id: params.ticketTypeId }
    });
    if (!ticketType || ticketType.sold + params.quantity > ticketType.capacity) {
      throw new Error('Yeterli bilet kalmadı');
    }

    const created = await tx.order.create({
      data: {
        userId: params.userId,
        eventId: params.eventId,
        organizerId: params.organizerId,
        subtotal,
        total: subtotal,
        status: 'paid',
        paymentProvider: 'free',
        paymentId: `free_${Date.now()}`,
        paidAt: new Date(),
        items: {
          create: {
            ticketTypeId: params.ticketTypeId,
            quantity: params.quantity,
            unitPrice: params.unitPrice
          }
        }
      }
    });

    await tx.transaction.create({
      data: {
        orderId: created.id,
        organizerId: params.organizerId,
        amount: subtotal,
        status: 'completed',
        provider: 'free',
        providerRef: created.paymentId
      }
    });

    await issueTickets(tx, {
      orderId: created.id,
      userId: params.userId,
      eventId: params.eventId,
      ticketTypeId: params.ticketTypeId,
      quantity: params.quantity
    });

    return created;
  });

  return order.id;
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function issueTickets(
  tx: Tx,
  params: {
    orderId: string;
    userId: string;
    eventId: string;
    ticketTypeId: string;
    quantity: number;
  }
): Promise<void> {
  const ticketType = await tx.ticketType.findUnique({
    where: { id: params.ticketTypeId }
  });
  if (!ticketType) throw new Error('Bilet türü bulunamadı');

  const reserved = await tx.ticketType.updateMany({
    where: {
      id: params.ticketTypeId,
      sold: { lte: ticketType.capacity - params.quantity }
    },
    data: { sold: { increment: params.quantity } }
  });
  if (reserved.count === 0) {
    throw new Error('Yeterli bilet kalmadı');
  }

  for (let i = 0; i < params.quantity; i++) {
    const ticketId = newTicketId();
    await tx.purchasedTicket.create({
      data: {
        id: ticketId,
        orderId: params.orderId,
        ticketTypeId: params.ticketTypeId,
        userId: params.userId,
        eventId: params.eventId,
        ticketCode: generateTicketCode(),
        validationToken: generateValidationToken(ticketId, params.eventId),
        status: 'VALID'
      }
    });
  }
}

export async function fulfillPaidOrder(params: {
  orderId: string;
  provider: PaymentProviderName;
  providerPaymentId: string;
}): Promise<{ orderId: string; ticketCount: number; alreadyFulfilled: boolean }> {
  await ensureDbConnection();

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: params.orderId, deletedAt: null },
      include: { items: true, purchasedTickets: true }
    });
    if (!order) throw new Error('Sipariş bulunamadı');

    if (order.status === 'paid') {
      return {
        orderId: order.id,
        ticketCount: order.purchasedTickets.length,
        alreadyFulfilled: true
      };
    }

    if (order.status !== 'pending') {
      throw new Error('Sipariş ödeme için uygun değil');
    }

    if (order.expiresAt && order.expiresAt < new Date()) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'cancelled' }
      });
      throw new Error('Sipariş süresi doldu');
    }

    let ticketCount = 0;
    for (const item of order.items) {
      await issueTickets(tx, {
        orderId: order.id,
        userId: order.userId,
        eventId: order.eventId,
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity
      });
      ticketCount += item.quantity;
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'paid',
        paymentProvider: params.provider,
        paymentId: params.providerPaymentId,
        paidAt: new Date()
      }
    });

    await tx.transaction.updateMany({
      where: { orderId: order.id, status: 'pending' },
      data: {
        status: 'completed',
        provider: params.provider,
        providerRef: params.providerPaymentId
      }
    });

    return { orderId: order.id, ticketCount, alreadyFulfilled: false };
  });
}

export async function failPendingOrder(params: {
  orderId: string;
  provider: PaymentProviderName;
  providerPaymentId?: string;
}): Promise<void> {
  await ensureDbConnection();

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: params.orderId } });
    if (!order || order.status !== 'pending') return;

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'cancelled',
        paymentId: params.providerPaymentId || order.paymentId
      }
    });

    await tx.transaction.updateMany({
      where: { orderId: order.id, status: 'pending' },
      data: { status: 'failed', providerRef: params.providerPaymentId }
    });
  });
}

export async function getOrderForUser(params: {
  orderId: string;
  firebaseUid: string;
}) {
  await ensureDbConnection();

  const user = await prisma.user.findFirst({
    where: { firebaseUid: params.firebaseUid, deletedAt: null }
  });
  if (!user) return null;

  return prisma.order.findFirst({
    where: { id: params.orderId, userId: user.id, deletedAt: null },
    include: {
      event: { select: { title: true, slug: true, coverImage: true } },
      purchasedTickets: { select: { id: true, status: true } },
      items: true
    }
  });
}

export async function expireStalePendingOrders(): Promise<number> {
  await ensureDbConnection();
  const now = new Date();

  const stale = await prisma.order.findMany({
    where: {
      status: 'pending',
      expiresAt: { lt: now },
      deletedAt: null
    },
    select: { id: true, paymentProvider: true }
  });

  for (const order of stale) {
    await failPendingOrder({
      orderId: order.id,
      provider: (order.paymentProvider as PaymentProviderName) || 'mock'
    });
  }

  return stale.length;
}

/** @deprecated createCheckout kullanın */
export async function checkoutEvent(params: {
  firebaseUid: string;
  eventSlug: string;
  quantity: number;
}) {
  const result = await createCheckout(params);
  if (result.status === 'pending') {
    throw new Error('Ödeme oturumu başlatıldı — redirectUrl kullanın');
  }
  return { orderId: result.orderId, ticketCount: result.ticketCount! };
}

export async function listOrdersForAdmin(params?: {
  status?: string;
  limit?: number;
}) {
  await ensureDbConnection();

  return prisma.order.findMany({
    where: {
      deletedAt: null,
      ...(params?.status ? { status: params.status as never } : {})
    },
    include: {
      user: { select: { email: true, displayName: true } },
      event: { select: { title: true, slug: true } },
      organizer: { select: { name: true } },
      transactions: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { createdAt: 'desc' },
    take: params?.limit ?? 100
  });
}

export async function requestOrderRefund(params: {
  orderId: string;
  reason?: string;
}): Promise<{ ok: boolean; message: string }> {
  await ensureDbConnection();

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { purchasedTickets: true }
  });
  if (!order) throw new Error('Sipariş bulunamadı');
  if (order.status !== 'paid') {
    throw new Error('Yalnızca ödenmiş siparişler iade edilebilir');
  }

  const provider = order.paymentProvider as PaymentProviderName;
  if (provider !== 'free' && provider !== 'mock') {
    return {
      ok: false,
      message: `${provider} iade API'si henüz bağlanmadı. Ödeme kuruluşu onayı sonrası aktif edilecek.`
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: 'refunded' }
    });

    await tx.purchasedTicket.updateMany({
      where: { orderId: order.id },
      data: { status: 'REFUNDED' }
    });

    await tx.transaction.updateMany({
      where: { orderId: order.id },
      data: { status: 'refunded' }
    });

    for (const item of await tx.orderItem.findMany({
      where: { orderId: order.id }
    })) {
      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { sold: { decrement: item.quantity } }
      });
    }
  });

  return { ok: true, message: 'İade işlendi (mock/free)' };
}
