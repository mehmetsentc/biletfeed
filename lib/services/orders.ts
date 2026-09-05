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
import { createPaymentAccessToken } from '@/lib/payments/payment-access-token';
// Muhasebe/pdfkit — checkout serverless bundle'ına girmesin (Vercel ENOENT)
// Email modülleri dynamic import — statik importlar webpack'i client bundle'a
// fs/Node.js built-in çekebileceğinden, runtime'da yüklenir
import { validateCoupon, incrementCouponUsage } from '@/lib/services/coupons';
import { notifyTicketPurchase } from '@/lib/services/notifications';
import { findOrCreateGuestUser } from '@/lib/services/guest-user';
import { upsertUserBillingProfile } from '@/lib/services/user-billing';
import {
  calculateOrderCommission,
  resolveOrganizerCommissionRate
} from '@/lib/services/commission';
import type { UserBillingInput } from '@/lib/services/user-billing';
import type { PaymentProviderName } from '@/lib/payments/types';
import { parseSectionSeatUnitId } from '@/lib/tickets/seat-packages';
import { extractSeatUnitId } from '@/lib/tickets/seat-label';
import { effectiveTicketPrice, lineSubtotalForQuantity } from '@/lib/services/event-sale-discount';
import type { CheckoutTicketType } from '@/lib/tickets/purchase-types';

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

type CheckoutLineItem = {
  ticketTypeId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  /** Kategori biletinde seçilen koltuk unit id’leri */
  seatUnitIds?: string[];
};

async function loadEventForCheckout(eventSlug: string) {
  await ensureDbConnection();
  const event = await prisma.event.findFirst({
    where: { slug: eventSlug, status: 'published', deletedAt: null },
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

  let saleCampaignType = 'percent';
  try {
    const campaignRows = await prisma.$queryRaw<
      Array<{ sale_campaign_type: string | null }>
    >`
      SELECT sale_campaign_type FROM events WHERE id = ${event.id}::uuid LIMIT 1
    `;
    saleCampaignType = campaignRows[0]?.sale_campaign_type ?? 'percent';
  } catch {
    /* kolon henüz yoksa percent */
  }

  return {
    ...event,
    saleCampaignType
  };
}

async function loadCheckoutContext(params: {
  userId: string;
  eventSlug: string;
  quantity: number;
  ticketTypeId?: string;
  ticketTypeIds?: string[];
  seatUnitIds?: string[];
}) {
  await ensureDbConnection();

  const user = await prisma.user.findFirst({
    where: { id: params.userId, deletedAt: null }
  });
  if (!user) throw new Error('Kullanıcı bulunamadı');

  const event = await loadEventForCheckout(params.eventSlug);

  const multiIds = params.ticketTypeIds?.filter(Boolean) ?? [];
  const seatUnitIds = params.seatUnitIds?.filter(Boolean) ?? [];
  if (multiIds.length > 0) {
    if (multiIds.length > 10) {
      throw new Error('En fazla 10 koltuk seçebilirsiniz');
    }

    // seatUnitIds ile kategori biletleri: aynı ticketType birden fazla olabilir
    if (seatUnitIds.length > 0) {
      if (seatUnitIds.length !== multiIds.length) {
        throw new Error('Koltuk ve bilet eşlemesi uyuşmuyor');
      }
      const uniqueSeats = [...new Set(seatUnitIds.map((s) => s.toUpperCase()))];
      if (uniqueSeats.length !== seatUnitIds.length) {
        throw new Error('Aynı koltuk birden fazla seçilemez');
      }

      // Satılmış koltukları tekrar satma (seatUnitId + attendeeName)
      const takenTickets = await prisma.purchasedTicket.findMany({
        where: {
          eventId: event.id,
          status: { in: ['VALID', 'USED'] },
          deletedAt: null,
          OR: [
            { seatUnitId: { in: uniqueSeats } },
            ...uniqueSeats.map((seat) => ({
              attendeeName: { contains: seat }
            }))
          ]
        },
        select: { seatUnitId: true, attendeeName: true },
        take: 200
      });
      const taken = new Set<string>();
      for (const t of takenTickets) {
        const id = extractSeatUnitId({
          seatUnitId: t.seatUnitId,
          attendeeName: t.attendeeName
        });
        if (id && uniqueSeats.includes(id)) taken.add(id);
      }
      if (taken.size > 0) {
        throw new Error(
          `Bu koltuk(lar) satılmış: ${[...taken].join(', ')}. Lütfen başka koltuk seçin.`
        );
      }

      const grouped = new Map<
        string,
        { tt: (typeof event.ticketTypes)[number]; seats: string[]; qty: number }
      >();
      for (let i = 0; i < multiIds.length; i++) {
        const id = multiIds[i]!;
        const seat = seatUnitIds[i]!;
        const tt = event.ticketTypes.find((t) => t.id === id);
        if (!tt) throw new Error('Seçilen koltuklardan biri bulunamadı');
        if (!event.isFree && tt.price <= 0) {
          throw new Error(`"${tt.name}" şu an satışta değil`);
        }
        const g = grouped.get(id);
        if (g) {
          g.qty += 1;
          g.seats.push(seat);
        } else {
          grouped.set(id, { tt, seats: [seat], qty: 1 });
        }
      }

      const lines: CheckoutLineItem[] = [];
      for (const g of grouped.values()) {
        if (g.tt.sold + g.qty > g.tt.capacity) {
          throw new Error(`"${g.tt.name}" için yeterli bilet kalmadı`);
        }
        const charge = lineSubtotalForQuantity(event, g.tt, g.qty);
        const avgUnit =
          g.qty > 0 ? Math.round((charge / g.qty) * 100) / 100 : 0;
        lines.push({
          ticketTypeId: g.tt.id,
          name: g.tt.name,
          unitPrice: avgUnit,
          quantity: g.qty,
          seatUnitIds: g.seats
        });
      }

      const subtotal = [...grouped.values()].reduce(
        (s, g) => s + lineSubtotalForQuantity(event, g.tt, g.qty),
        0
      );
      const commissionRate = await resolveOrganizerCommissionRate(
        event.organizer.commissionRate
      );
      const commission = calculateOrderCommission(subtotal, commissionRate);
      const primary = event.ticketTypes.find((t) => t.id === lines[0]!.ticketTypeId)!;
      const qty = lines.reduce((n, l) => n + l.quantity, 0);

      return {
        user,
        event,
        ticketType: primary,
        lines,
        qty,
        subtotal,
        commission
      };
    }

    const unique = [...new Set(multiIds)];
    if (unique.length !== multiIds.length) {
      throw new Error('Aynı koltuk birden fazla seçilemez');
    }

    // Aynı kategoriden birden fazla → BOGO gruplu
    const byType = new Map<string, (typeof event.ticketTypes)[number]>();
    for (const id of unique) {
      const tt = event.ticketTypes.find((t) => t.id === id);
      if (!tt) throw new Error('Seçilen koltuklardan biri bulunamadı');
      if (tt.sold + 1 > tt.capacity) {
        throw new Error(`"${tt.name}" koltuğu artık müsait değil`);
      }
      byType.set(id, tt);
    }
    const groupedUnique = new Map<
      string,
      { tt: (typeof event.ticketTypes)[number]; qty: number }
    >();
    for (const id of unique) {
      const tt = byType.get(id)!;
      const g = groupedUnique.get(tt.id);
      if (g) g.qty += 1;
      else groupedUnique.set(tt.id, { tt, qty: 1 });
    }

    const lines: CheckoutLineItem[] = [];
    for (const g of groupedUnique.values()) {
      const charge = lineSubtotalForQuantity(event, g.tt, g.qty);
      const avgUnit =
        g.qty > 0 ? Math.round((charge / g.qty) * 100) / 100 : 0;
      lines.push({
        ticketTypeId: g.tt.id,
        name: g.tt.name,
        unitPrice: avgUnit,
        quantity: g.qty
      });
    }

    const subtotal = [...groupedUnique.values()].reduce(
      (s, g) => s + lineSubtotalForQuantity(event, g.tt, g.qty),
      0
    );
    const commissionRate = await resolveOrganizerCommissionRate(
      event.organizer.commissionRate
    );
    const commission = calculateOrderCommission(subtotal, commissionRate);
    const primary = event.ticketTypes.find((t) => t.id === lines[0]!.ticketTypeId)!;

    return {
      user,
      event,
      ticketType: primary,
      lines,
      qty: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal,
      commission
    };
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

  const subtotal = lineSubtotalForQuantity(event, ticketType, qty);
  const avgUnit = qty > 0 ? Math.round((subtotal / qty) * 100) / 100 : 0;
  const commissionRate = await resolveOrganizerCommissionRate(event.organizer.commissionRate);
  const commission = calculateOrderCommission(subtotal, commissionRate);
  const lines: CheckoutLineItem[] = [
    {
      ticketTypeId: ticketType.id,
      name: ticketType.name,
      unitPrice: avgUnit,
      quantity: qty
    }
  ];

  return { user, event, ticketType, lines, qty, subtotal, commission };
}

export async function getCheckoutTicketTypes(
  eventSlug: string
): Promise<CheckoutTicketType[]> {
  await ensureDbConnection();
  const event = await prisma.event.findFirst({
    where: { slug: eventSlug, status: 'published', deletedAt: null },
    select: {
      id: true,
      isFree: true,
      saleDiscountPercent: true,
      saleDiscountTicketTypeIds: true,
      saleDiscountActive: true,
      saleDiscountEndsAt: true,
      ticketTypes: {
        where: { status: { in: ['active', 'sold_out'] }, deletedAt: null },
        orderBy: { price: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          price: true,
          currency: true,
          capacity: true,
          sold: true,
          seatsPerUnit: true,
          showLowStockBadge: true,
          status: true,
          _count: {
            select: {
              purchasedTickets: {
                where: { deletedAt: null, status: { in: ['VALID', 'USED'] } }
              }
            }
          }
        }
      }
    }
  });
  if (!event) return [];

  let saleCampaignType = 'percent';
  try {
    const campaignRows = await prisma.$queryRaw<
      Array<{ sale_campaign_type: string | null }>
    >`
      SELECT sale_campaign_type FROM events WHERE id = ${event.id}::uuid LIMIT 1
    `;
    saleCampaignType = campaignRows[0]?.sale_campaign_type ?? 'percent';
  } catch {
    /* kolon henüz yoksa percent */
  }
  const saleFields = {
    ...event,
    saleCampaignType
  };
  // İptal edilen biletler her zaman deletedAt işaretlenmediğinden (admin iptal
  // yolu status'u CANCELLED yapar ama deletedAt'ı boş bırakabilir), sayaç kayabilir.
  // Gerçek satılan sayıyı canlı sayımla düzelt — kaymışsa DB'yi de senkronla.
  await Promise.all(
    event.ticketTypes
      .filter((tt) => tt.sold !== tt._count.purchasedTickets)
      .map((tt) =>
        prisma.ticketType.update({
          where: { id: tt.id },
          data: { sold: tt._count.purchasedTickets }
        })
      )
  );

  return event.ticketTypes
    .filter((tt) => event.isFree || tt.price > 0)
    .map((tt) => {
    const eff = effectiveTicketPrice(saleFields, tt);
    return {
      id: tt.id,
      name: tt.name,
      description: tt.description ?? '',
      type: tt.type,
      price: eff.unitPrice,
      listPrice: eff.listPrice,
      isOnSale: eff.isOnSale,
      discountPercent: eff.discountPercent,
      isBogo: eff.isBogo,
      currency: tt.currency,
      capacity: tt.capacity,
      sold: tt._count.purchasedTickets,
      seatsPerUnit: Math.max(1, tt.seatsPerUnit ?? 1),
      showLowStockBadge: tt.showLowStockBadge,
      status: tt.status === 'sold_out' ? 'sold_out' : 'active',
      allowsZeroPrice: Boolean(event.isFree)
    };
  });
}

export async function createCheckout(params: {
  firebaseUid?: string;
  eventSlug: string;
  quantity: number;
  ticketTypeId?: string;
  /** Çoklu koltuk seçimi — her id için quantity=1 OrderItem */
  ticketTypeIds?: string[];
  /** Kategori biletlerinde seçilen koltuk unit id’leri (ticketTypeIds ile paralel) */
  seatUnitIds?: string[];
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  couponCode?: string;
  billing?: UserBillingInput;
}): Promise<CheckoutResult> {
  const attendeeName = params.attendeeName.trim();
  const attendeeEmail = params.attendeeEmail.trim().toLowerCase();
  const attendeePhone = params.attendeePhone;

  const user = await resolveCheckoutUser({
    firebaseUid: params.firebaseUid,
    attendeeName,
    attendeeEmail
  });

  const { event, lines, qty, subtotal, commission } = await loadCheckoutContext({
    userId: user.id,
    eventSlug: params.eventSlug,
    quantity: params.quantity,
    ticketTypeId: params.ticketTypeId,
    ticketTypeIds: params.ticketTypeIds,
    seatUnitIds: params.seatUnitIds
  });

  const flatSeatIds = lines.flatMap((l) => l.seatUnitIds ?? []);
  const seatsRef =
    flatSeatIds.length > 0 ? `seats:${flatSeatIds.join(',')}` : null;

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
  const isPaidCheckout = total > 0 && !event.isFree;

  if (isPaidCheckout) {
    if (!params.billing) {
      throw new Error('Ücretli siparişler için fatura bilgileri zorunludur');
    }
    await upsertUserBillingProfile(user.id, params.billing);
  } else if (params.billing) {
    await upsertUserBillingProfile(user.id, params.billing);
  }

  if (total <= 0 || event.isFree) {
    const orderId = await fulfillFreeOrder({
      userId: user.id,
      eventId: event.id,
      organizerId: event.organizerId,
      lines,
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
    for (const line of lines) {
      const freshType = await tx.ticketType.findUnique({
        where: { id: line.ticketTypeId }
      });
      if (!freshType || freshType.sold + line.quantity > freshType.capacity) {
        throw new Error(`"${line.name}" için yeterli bilet kalmadı`);
      }
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
          create: lines.map((line) => ({
            ticketTypeId: line.ticketTypeId,
            quantity: line.quantity,
            unitPrice: line.unitPrice
          }))
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
      provider: providerName,
      providerRef: seatsRef
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
    items: lines.map((line) => ({
      id: line.ticketTypeId,
      name: line.name,
      price: line.unitPrice,
      quantity: line.quantity
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

  const paymentToken = createPaymentAccessToken(order.id);
  const redirectBase =
    payment.provider === 'tosla'
      ? `${base}/odeme/kart/${order.id}?pt=${encodeURIComponent(paymentToken)}`
      : payment.provider === 'iyzico'
        ? `${base}/odeme/guvenli/${order.id}?pt=${encodeURIComponent(paymentToken)}`
        : payment.checkoutUrl;

  return {
    orderId: order.id,
    status: 'pending',
    redirectUrl: redirectBase,
    provider: payment.provider
  };
}

async function fulfillFreeOrder(params: {
  userId: string;
  eventId: string;
  organizerId: string;
  lines: CheckoutLineItem[];
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  discount?: number;
  couponCode?: string;
  couponId?: string;
}): Promise<string> {
  const subtotal = params.lines.reduce(
    (s, l) => s + l.unitPrice * l.quantity,
    0
  );
  const discount = params.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const order = await prisma.$transaction(async (tx) => {
    for (const line of params.lines) {
      const ticketType = await tx.ticketType.findUnique({
        where: { id: line.ticketTypeId }
      });
      if (!ticketType || ticketType.sold + line.quantity > ticketType.capacity) {
        throw new Error(`"${line.name}" için yeterli bilet kalmadı`);
      }
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
          create: params.lines.map((line) => ({
            ticketTypeId: line.ticketTypeId,
            quantity: line.quantity,
            unitPrice: line.unitPrice
          }))
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

    for (const line of params.lines) {
      await issueTickets(tx, {
        orderId: created.id,
        userId: params.userId,
        eventId: params.eventId,
        ticketTypeId: line.ticketTypeId,
        quantity: line.quantity,
        attendeeName: params.attendeeName,
        attendeeEmail: params.attendeeEmail,
        attendeePhone: params.attendeePhone,
        seatUnitIds: line.seatUnitIds
      });
    }

    return created;
  });

  void import('@/lib/accounting/fulfillment')
    .then(({ processOrderAccounting }) => processOrderAccounting(order.id))
    .catch((err) => {
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
    seatUnitIds?: string[];
  }
): Promise<void> {
  const ticketType = await tx.ticketType.findUnique({
    where: { id: params.ticketTypeId }
  });
  if (!ticketType) throw new Error('Bilet türü bulunamadı');

  const units = Math.max(1, params.quantity);
  const seatsPerUnit = Math.max(1, ticketType.seatsPerUnit || 1);
  const qrCount = units * seatsPerUnit;

  const reserved = await tx.ticketType.updateMany({
    where: {
      id: params.ticketTypeId,
      sold: { lte: ticketType.capacity - units }
    },
    data: { sold: { increment: units } }
  });
  if (reserved.count === 0) {
    throw new Error('Yeterli bilet kalmadı');
  }

  const seatUnitIdFromName = parseSectionSeatUnitId(ticketType.name);
  const seatIds = params.seatUnitIds ?? [];

  for (let i = 0; i < qrCount; i++) {
    const ticketId = newTicketId();
    const seatFromList = seatIds[i] ?? seatIds[Math.floor(i / seatsPerUnit)];
    const seatUnitId = seatFromList ?? seatUnitIdFromName;
    const seatLabel =
      seatsPerUnit > 1 && !seatUnitId
        ? ` (${i + 1}/${qrCount})`
        : seatUnitId
          ? ` · ${seatUnitId}`
          : '';
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
        attendeeName: params.attendeeName
          ? `${params.attendeeName}${seatLabel}`
          : seatUnitId
            ? seatUnitId
            : null,
        attendeeEmail: params.attendeeEmail ?? null,
        attendeePhone: params.attendeePhone ?? null,
        seatUnitId: seatUnitId ?? null
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
    // Tosla 20 karakterli orderId gönderir (kısaltılmış UUID); echo ile tam UUID
    // geri gelmezse prefix arama ile bul.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let resolvedOrderId = params.orderId;
    if (!UUID_RE.test(params.orderId) && params.orderId.length <= 32) {
      const rows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM orders WHERE REPLACE(id::text, '-', '') ILIKE $1 AND deleted_at IS NULL LIMIT 1`,
        params.orderId.toLowerCase() + '%'
      );
      if ((rows as Array<{ id: string }>)[0]?.id) {
        resolvedOrderId = (rows as Array<{ id: string }>)[0].id;
      }
    }

    const order = await tx.order.findFirst({
      where: { id: resolvedOrderId, deletedAt: null },
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
    const seatTxn = await tx.transaction.findFirst({
      where: { orderId: order.id, deletedAt: null },
      orderBy: { createdAt: 'asc' }
    });
    const allSeats =
      seatTxn?.providerRef?.startsWith('seats:')
        ? seatTxn.providerRef.slice(6).split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    let seatCursor = 0;

    for (const item of order.items) {
      const seatUnitIds =
        allSeats.length > 0
          ? allSeats.slice(seatCursor, seatCursor + item.quantity)
          : undefined;
      seatCursor += item.quantity;
      await issueTickets(tx, {
        orderId: order.id,
        userId: order.userId,
        eventId: order.eventId,
        ticketTypeId: item.ticketTypeId,
        quantity: item.quantity,
        attendeeName: order.attendeeName,
        attendeeEmail: order.attendeeEmail,
        attendeePhone: order.attendeePhone,
        seatUnitIds
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
      void import('@/lib/accounting/fulfillment')
        .then(({ processOrderAccounting }) =>
          processOrderAccounting(result.orderId)
        )
        .catch((err) => {
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
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let resolvedOrderId = params.orderId;
    if (!UUID_RE.test(params.orderId) && params.orderId.length <= 32) {
      const rows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM orders WHERE REPLACE(id::text, '-', '') ILIKE $1 AND deleted_at IS NULL LIMIT 1`,
        params.orderId.toLowerCase() + '%'
      );
      if ((rows as Array<{ id: string }>)[0]?.id) {
        resolvedOrderId = (rows as Array<{ id: string }>)[0].id;
      }
    }

    const order = await tx.order.findUnique({ where: { id: resolvedOrderId } });
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
  const { processOrderRefund } = await import('@/lib/services/order-refund');
  return processOrderRefund({
    orderId: params.orderId,
    reason: params.reason
  });
}
