import { randomUUID } from 'crypto';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import {
  getAppBaseUrl,
  getPaymentProviderName
} from '@/lib/payments/config';
import { startPaymentCheckout } from '@/lib/payments/process';
import { createPaymentAccessToken } from '@/lib/payments/payment-access-token';
import {
  upsertUserBillingProfile,
  type UserBillingInput
} from '@/lib/services/user-billing';
import type { PaymentProviderName } from '@/lib/payments/types';
import {
  fulfillFreeOrder,
  loadCheckoutContext,
  pendingExpiresAt,
  resolveCheckoutUser,
  type CheckoutLineItem,
  type CheckoutResult
} from '@/lib/services/orders';
import { createSeatHoldsForOrder } from '@/lib/tickets/seat-hold';

export type CartCheckoutItemInput = {
  eventSlug: string;
  quantity: number;
  ticketTypeId?: string;
  ticketTypeIds?: string[];
  seatUnitIds?: string[];
};

export type CartCheckoutResult = CheckoutResult & {
  orderIds: string[];
  cartGroupId: string;
};

type PreparedEventCheckout = {
  event: Awaited<ReturnType<typeof loadCheckoutContext>>['event'];
  lines: CheckoutLineItem[];
  qty: number;
  subtotal: number;
  commission: number;
  seatsRef: string | null;
};

/**
 * Farklı gün/etkinlik biletlerini tek ödemede tahsil eder.
 * Her etkinlik ayrı Order olur; cartGroupId ile bağlanır.
 */
export async function createCartCheckout(params: {
  firebaseUid?: string;
  items: CartCheckoutItemInput[];
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  billing?: UserBillingInput;
}): Promise<CartCheckoutResult> {
  await ensureDbConnection();

  if (!params.items.length) {
    throw new Error('Sepet boş');
  }
  if (params.items.length > 15) {
    throw new Error('Sepette en fazla 15 etkinlik satırı olabilir');
  }

  const attendeeName = params.attendeeName.trim();
  const attendeeEmail = params.attendeeEmail.trim().toLowerCase();
  const attendeePhone = params.attendeePhone;

  const user = await resolveCheckoutUser({
    firebaseUid: params.firebaseUid,
    attendeeName,
    attendeeEmail
  });

  const grouped = new Map<string, CartCheckoutItemInput[]>();
  for (const item of params.items) {
    const slug = item.eventSlug.trim();
    if (!slug) throw new Error('Geçersiz etkinlik');
    const list = grouped.get(slug) ?? [];
    list.push(item);
    grouped.set(slug, list);
  }

  const prepared: PreparedEventCheckout[] = [];

  for (const [eventSlug, items] of grouped) {
    const ticketTypeIds: string[] = [];
    const seatUnitIds: string[] = [];
    let plainQuantity = 0;
    let plainTicketTypeId: string | undefined;

    for (const item of items) {
      if (item.ticketTypeIds?.length) {
        ticketTypeIds.push(...item.ticketTypeIds);
        if (item.seatUnitIds?.length) {
          seatUnitIds.push(...item.seatUnitIds);
        }
      } else if (item.ticketTypeId) {
        if (item.seatUnitIds?.length) {
          for (const seat of item.seatUnitIds) {
            ticketTypeIds.push(item.ticketTypeId);
            seatUnitIds.push(seat);
          }
        } else if (!plainTicketTypeId || plainTicketTypeId === item.ticketTypeId) {
          plainTicketTypeId = item.ticketTypeId;
          plainQuantity += item.quantity;
        } else {
          for (let i = 0; i < item.quantity; i++) {
            ticketTypeIds.push(item.ticketTypeId);
          }
        }
      } else {
        throw new Error('Bilet tipi seçilmedi');
      }
    }

    const ctx =
      ticketTypeIds.length > 0
        ? await loadCheckoutContext({
            userId: user.id,
            eventSlug,
            quantity: ticketTypeIds.length,
            ticketTypeIds,
            seatUnitIds: seatUnitIds.length > 0 ? seatUnitIds : undefined
          })
        : await loadCheckoutContext({
            userId: user.id,
            eventSlug,
            quantity: Math.max(1, plainQuantity),
            ticketTypeId: plainTicketTypeId
          });

    const flatSeatIds = ctx.lines.flatMap((l) => l.seatUnitIds ?? []);
    prepared.push({
      event: ctx.event,
      lines: ctx.lines,
      qty: ctx.qty,
      subtotal: ctx.subtotal,
      commission: ctx.commission,
      seatsRef: flatSeatIds.length > 0 ? `seats:${flatSeatIds.join(',')}` : null
    });
  }

  const grandTotal =
    Math.round(prepared.reduce((s, p) => s + p.subtotal, 0) * 100) / 100;
  const isPaidCheckout = prepared.some((p) => p.subtotal > 0 && !p.event.isFree);

  if (isPaidCheckout) {
    if (!params.billing) {
      throw new Error('Ücretli siparişler için fatura bilgileri zorunludur');
    }
    await upsertUserBillingProfile(user.id, params.billing);
  } else if (params.billing) {
    await upsertUserBillingProfile(user.id, params.billing);
  }

  const cartGroupId = randomUUID();

  if (!isPaidCheckout || grandTotal <= 0) {
    const orderIds: string[] = [];
    let ticketCount = 0;
    for (const p of prepared) {
      const orderId = await fulfillFreeOrder({
        userId: user.id,
        eventId: p.event.id,
        organizerId: p.event.organizerId,
        lines: p.lines,
        attendeeName,
        attendeeEmail,
        attendeePhone
      });
      await prisma.order.update({
        where: { id: orderId },
        data: { cartGroupId }
      });
      orderIds.push(orderId);
      ticketCount += p.qty;
    }
    return {
      orderId: orderIds[0]!,
      orderIds,
      cartGroupId,
      status: 'paid',
      ticketCount,
      provider: 'free'
    };
  }

  const providerName = getPaymentProviderName();
  const base = getAppBaseUrl();

  const createdOrders = await prisma.$transaction(async (tx) => {
    const orders: Array<{
      id: string;
      total: number;
      lines: CheckoutLineItem[];
      eventTitle: string;
    }> = [];

    for (const p of prepared) {
      for (const line of p.lines) {
        const freshType = await tx.ticketType.findUnique({
          where: { id: line.ticketTypeId }
        });
        if (!freshType || freshType.sold + line.quantity > freshType.capacity) {
          throw new Error(`"${line.name}" için yeterli bilet kalmadı`);
        }
      }

      const total = Math.max(0, Math.round(p.subtotal * 100) / 100);
      const order = await tx.order.create({
        data: {
          userId: user.id,
          eventId: p.event.id,
          organizerId: p.event.organizerId,
          subtotal: p.subtotal,
          discount: 0,
          commission: p.commission,
          total,
          status: 'pending',
          paymentProvider: providerName,
          cartGroupId,
          expiresAt: pendingExpiresAt(),
          attendeeName,
          attendeeEmail,
          attendeePhone,
          items: {
            create: p.lines.map((line) => ({
              ticketTypeId: line.ticketTypeId,
              quantity: line.quantity,
              unitPrice: line.unitPrice
            }))
          }
        }
      });

      await tx.transaction.create({
        data: {
          orderId: order.id,
          organizerId: p.event.organizerId,
          amount: p.subtotal,
          status: 'pending',
          provider: providerName,
          providerRef: p.seatsRef
        }
      });

      await createSeatHoldsForOrder(tx, {
        eventId: p.event.id,
        orderId: order.id,
        seatUnitIds: p.lines.flatMap((l) => l.seatUnitIds ?? []),
        expiresAt: order.expiresAt ?? pendingExpiresAt()
      });

      orders.push({
        id: order.id,
        total,
        lines: p.lines,
        eventTitle: p.event.title
      });
    }

    return orders;
  });

  const primary = createdOrders[0]!;
  const paymentAmount =
    Math.round(createdOrders.reduce((s, o) => s + o.total, 0) * 100) / 100;

  const paymentItems = createdOrders.flatMap((o) =>
    o.lines.map((line) => ({
      id: line.ticketTypeId,
      name: `${o.eventTitle} — ${line.name}`.slice(0, 120),
      price: line.unitPrice,
      quantity: line.quantity
    }))
  );

  const eventTitle =
    createdOrders.length === 1
      ? primary.eventTitle
      : `Sepet (${createdOrders.length} etkinlik)`;

  const payment = await startPaymentCheckout({
    orderId: primary.id,
    amount: paymentAmount,
    currency: 'TRY',
    buyer: {
      id: user.id,
      email: user.email,
      name: user.displayName || undefined
    },
    items: paymentItems,
    eventTitle,
    successUrl: `${base}/odeme/basarili?order=${primary.id}&cart=${cartGroupId}`,
    failureUrl: `${base}/odeme/basarisiz?order=${primary.id}&cart=${cartGroupId}`,
    callbackUrl: `${base}/api/payments/callback/${providerName}`
  });

  await prisma.order.updateMany({
    where: { cartGroupId },
    data: { paymentSessionId: payment.sessionId }
  });

  const paymentToken = createPaymentAccessToken(primary.id);
  const redirectBase =
    payment.provider === 'tosla'
      ? `${base}/odeme/kart/${primary.id}?pt=${encodeURIComponent(paymentToken)}`
      : payment.provider === 'iyzico'
        ? `${base}/odeme/guvenli/${primary.id}?pt=${encodeURIComponent(paymentToken)}`
        : payment.checkoutUrl;

  return {
    orderId: primary.id,
    orderIds: createdOrders.map((o) => o.id),
    cartGroupId,
    status: 'pending',
    redirectUrl: redirectBase,
    provider: payment.provider as PaymentProviderName
  };
}
