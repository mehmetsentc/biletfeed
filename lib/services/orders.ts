import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import {
  buildTicketQrPayload,
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
import { processOrderAccounting } from '@/lib/accounting/fulfillment';
import { createCreditNoteForRefund } from '@/lib/accounting/invoice';
// Email modülleri dynamic import — statik importlar webpack'i client bundle'a
// fs/Node.js built-in çekebileceğinden, runtime'da yüklenir
import { validateCoupon, incrementCouponUsage } from '@/lib/services/coupons';
import { notifyTicketPurchase } from '@/lib/services/notifications';
import { findOrCreateGuestUser } from '@/lib/services/guest-user';
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

async function resolveCheckoutUser(params: {
  firebaseUid?: string;
  attendeeName: string;
  attendeeEmail: string;
}) {
  await ensureDbConnection();

  if (params.firebaseUid) {
    const user = await prisma.user.findFirst({
      where: { firebaseUid: params.firebaseUid, deletedAt: null }
    });
    if (user) return user;
  }

  return findOrCreateGuestUser(params.attendeeName, params.attendeeEmail);
}

async function loadCheckoutContext(params: {
  userId: string;
  eventSlug: string;
  quantity: number;
  ticketTypeId?: string;
}) {
  await ensureDbConnection();

  const user = await prisma.user.findFirst({
    where: { id: params.userId, deletedAt: null }
  });
  if (!user) throw new Error('Kullanıcı bulunamadı');

  const event = await prisma.event.findFirst({
    where: { slug: params.eventSlug, status: 'published', deletedAt: null },
    include: {
      organizer: true,
      ticketTypes: {
        where: { status: 'active', deletedAt: null },
        orderBy: { price: 'asc' }
      }
    }
  });
  if (!event) throw new Error('Etkinlik bulunamadı');

  if (event.listingType === 'external') {
    throw new Error(
      'Bu etkinlik harici bir platformdadır. Bilet için kaynak siteye yönlendirilmelisiniz.'
    );
  }

  const ticketType =
    (params.ticketTypeId
      ? event.ticketTypes.find((t) => t.id === params.ticketTypeId)
      : undefined) ?? event.ticketTypes[0];

  if (!ticketType) throw new Error('Aktif bilet türü bulunamadı');

  const qty = Math.min(Math.max(params.quantity, 1), 10);
  if (ticketType.sold + qty > ticketType.capacity) {
    throw new Error('Yeterli bilet kalmadı');
  }

  const subtotal = ticketType.price * qty;
  const commissionRate = event.organizer.commissionRate ?? 0.1;
  const commission = Math.round(subtotal * commissionRate * 100) / 100;

  return { user, event, ticketType, ticketTypes: event.ticketTypes, qty, subtotal, commission };
}

export async function getCheckoutTicketTypes(eventSlug: string) {
  await ensureDbConnection();
  const event = await prisma.event.findFirst({
    where: { slug: eventSlug, status: 'published', deletedAt: null },
    select: {
      ticketTypes: {
        where: { status: 'active', deletedAt: null },
        orderBy: { price: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
          price: true,
          currency: true,
          capacity: true,
          sold: true,
          showLowStockBadge: true
        }
      }
    }
  });
  return event?.ticketTypes ?? [];
}

export async function createCheckout(params: {
  firebaseUid?: string;
  eventSlug: string;
  quantity: number;
  ticketTypeId?: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  couponCode?: string;
}): Promise<CheckoutResult> {
  const attendeeName = params.attendeeName.trim();
  const attendeeEmail = params.attendeeEmail.trim().toLowerCase();
  const attendeePhone = params.attendeePhone;

  const user = await resolveCheckoutUser({
    firebaseUid: params.firebaseUid,
    attendeeName,
    attendeeEmail
  });

  const { event, ticketType, qty, subtotal, commission } =
    await loadCheckoutContext({
      userId: user.id,
      eventSlug: params.eventSlug,
      quantity: params.quantity,
      ticketTypeId: params.ticketTypeId
    });

  let discount = 0;
  let appliedCouponId: string | undefined;
  let appliedCouponCode: string | undefined;

  if (params.couponCode?.trim()) {
    const coupon = await validateCoupon({
      code: params.couponCode,
      eventId: event.id,
      organizerId: event.organizerId,
      subtotal
    });
    discount = coupon.discount;
    appliedCouponId = coupon.couponId;
    appliedCouponCode = coupon.code;
  }

  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  if (total <= 0 || event.isFree) {
    const orderId = await fulfillFreeOrder({
      userId: user.id,
      eventId: event.id,
      organizerId: event.organizerId,
      ticketTypeId: ticketType.id,
      quantity: qty,
      unitPrice: ticketType.price,
      attendeeName,
      attendeeEmail,
      attendeePhone,
      discount,
      couponCode: appliedCouponCode,
      couponId: appliedCouponId
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
        discount,
        commission,
        total,
        status: 'pending',
        paymentProvider: providerName,
        expiresAt: pendingExpiresAt(),
        couponCode: appliedCouponCode ?? null,
        attendeeName,
        attendeeEmail,
        attendeePhone,
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
    amount: total,
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
    successUrl: `${base}/etkinlik/${event.slug}/bilet/basarili?order=${order.id}`,
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
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  discount?: number;
  couponCode?: string;
  couponId?: string;
}): Promise<string> {
  const subtotal = params.unitPrice * params.quantity;
  const discount = params.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

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
        discount,
        total,
        status: 'paid',
        paymentProvider: 'free',
        paymentId: `free_${Date.now()}`,
        paidAt: new Date(),
        couponCode: params.couponCode ?? null,
        attendeeName: params.attendeeName,
        attendeeEmail: params.attendeeEmail,
        attendeePhone: params.attendeePhone,
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
      quantity: params.quantity,
      attendeeName: params.attendeeName,
      attendeeEmail: params.attendeeEmail,
      attendeePhone: params.attendeePhone
    });

    return created;
  });

  void processOrderAccounting(order.id).catch((err) => {
    console.error('[accounting] free order', order.id, err);
  });

  void import('@/lib/email/send-ticket-purchase-email').then(({ sendTicketPurchaseEmail }) =>
    sendTicketPurchaseEmail(order.id)
  ).catch((err) => {
    console.error('[email] free order confirmation', order.id, err);
  });

  if (params.couponId) {
    void incrementCouponUsage(params.couponId).catch(() => {});
  }

  void prisma.event
    .findUnique({ where: { id: params.eventId }, select: { title: true } })
    .then((ev) => {
      if (ev) void notifyTicketPurchase(params.userId, ev.title, order.id);
    })
    .catch(() => {});

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
    attendeeName?: string | null;
    attendeeEmail?: string | null;
    attendeePhone?: string | null;
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
        status: 'VALID',
        attendeeName: params.attendeeName ?? null,
        attendeeEmail: params.attendeeEmail ?? null,
        attendeePhone: params.attendeePhone ?? null
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
        quantity: item.quantity,
        attendeeName: order.attendeeName,
        attendeeEmail: order.attendeeEmail,
        attendeePhone: order.attendeePhone
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
  }).then(async (result) => {
    if (!result.alreadyFulfilled) {
      const order = await prisma.order.findUnique({
        where: { id: result.orderId },
        select: { couponCode: true, userId: true, event: { select: { title: true } } }
      });
      if (order?.couponCode) {
        const coupon = await prisma.coupon.findFirst({
          where: { code: order.couponCode, deletedAt: null }
        });
        if (coupon) void incrementCouponUsage(coupon.id).catch(() => {});
      }
      if (order) {
        void notifyTicketPurchase(order.userId, order.event.title, result.orderId).catch(
          () => {}
        );
      }
      void processOrderAccounting(result.orderId).catch((err) => {
        console.error('[accounting] paid order', result.orderId, err);
      });
      void import('@/lib/email/send-ticket-purchase-email').then(({ sendTicketPurchaseEmail }) =>
        sendTicketPurchaseEmail(result.orderId)
      ).catch((err) => {
        console.error('[email] paid order confirmation', result.orderId, err);
      });
    }
    return result;
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

export async function getPaidOrderFirstTicket(params: {
  orderId: string;
  firebaseUid: string;
  eventSlug?: string;
}) {
  await ensureDbConnection();

  const user = await prisma.user.findFirst({
    where: { firebaseUid: params.firebaseUid, deletedAt: null }
  });
  if (!user) return null;

  const order = await prisma.order.findFirst({
    where: {
      id: params.orderId,
      userId: user.id,
      status: 'paid',
      deletedAt: null,
      ...(params.eventSlug ? { event: { slug: params.eventSlug } } : {})
    },
    include: {
      event: {
        include: {
          city: true,
          venue: true,
          category: true
        }
      },
      purchasedTickets: {
        take: 1,
        orderBy: { createdAt: 'asc' },
        include: { ticketType: true }
      }
    }
  });

  if (!order || order.purchasedTickets.length === 0) return null;

  const ticket = order.purchasedTickets[0];

  return {
    eventSlug: order.event.slug,
    eventTitle: order.event.title,
    eventDate: order.event.startDate,
    venue: order.event.venue?.name ?? 'Online',
    city: order.event.city.name,
    category: order.event.category.name,
    ticket: {
      id: ticket.id,
      ticketCode: ticket.ticketCode,
      validationToken: ticket.validationToken,
      holderName: ticket.attendeeName ?? order.attendeeName ?? 'Misafir',
      ticketTypeName: ticket.ticketType.name,
      qrData: buildTicketQrPayload({
        ticketId: ticket.id,
        ticketCode: ticket.ticketCode,
        validationToken: ticket.validationToken
      })
    }
  };
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
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
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

  void createCreditNoteForRefund(order.id).catch((err) => {
    console.error('[accounting] refund credit note', order.id, err);
  });

  void import('@/lib/email/send-refund-email').then(({ sendRefundNotificationEmail }) =>
    sendRefundNotificationEmail(order.id, params.reason)
  ).catch((err) => {
    console.error('[email] refund notification', order.id, err);
  });

  return { ok: true, message: 'İade işlendi (mock/free)' };
}
