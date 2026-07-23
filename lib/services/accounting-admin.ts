import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { companyLegal } from '@/lib/config/company';
import { formatCommissionRatePercent } from '@/lib/config/commission';
import { splitGrossAmount } from '@/lib/accounting/tax';
import { resolveOrganizerCommissionRate } from '@/lib/services/commission';
import {
  listAccountingExpenses,
  getEventProfitAndLoss
} from '@/lib/accounting/expenses';
import { readEInvoiceMeta } from '@/lib/accounting/einvoice/meta';
import { classifyGibError } from '@/lib/accounting/einvoice/gib-errors';
import { evaluateGibSendEligibility } from '@/lib/accounting/einvoice/gib-send-guard';

export async function getAccountingSummary() {
  await ensureDbConnection();

  const [
    invoiceCount,
    invoiceTotal,
    pendingPayouts,
    deferredRevenue,
    emailFailed,
    reconciledCount,
    mismatchCount
  ] = await Promise.all([
    prisma.invoice.count({ where: { status: 'issued', type: { not: 'credit_note' } } }),
    prisma.invoice.aggregate({
      where: { status: 'issued', type: { not: 'credit_note' } },
      _sum: { totalGross: true }
    }),
    prisma.organizerPayout.aggregate({
      where: { status: { in: ['pending', 'scheduled'] } },
      _sum: { netAmount: true },
      _count: true
    }),
    prisma.revenueRecognition.aggregate({
      where: { status: 'deferred' },
      _sum: { amount: true },
      _count: true
    }),
    prisma.emailDelivery.count({ where: { status: 'failed' } }),
    prisma.paymentReconciliation.count({ where: { status: 'reconciled' } }),
    prisma.paymentReconciliation.count({ where: { status: 'mismatch' } })
  ]);

  return {
    company: companyLegal,
    invoiceCount,
    invoiceTotal: invoiceTotal._sum.totalGross ?? 0,
    pendingPayoutAmount: pendingPayouts._sum.netAmount ?? 0,
    pendingPayoutCount: pendingPayouts._count,
    deferredRevenueAmount: deferredRevenue._sum.amount ?? 0,
    deferredRevenueCount: deferredRevenue._count,
    emailFailed,
    reconciledCount,
    mismatchCount
  };
}

/** Hafif fatura taraması — sekme rozeti (SMS bekleyen + GEÇİŞ hatası). */
export async function getAccountingInvoiceAlertCounts(limit = 100) {
  await ensureDbConnection();

  const invoices = await prisma.invoice.findMany({
    where: { status: { not: 'cancelled' } },
    orderBy: { issuedAt: 'desc' },
    take: limit,
    select: {
      eInvoiceUuid: true,
      metadata: true,
      issuedAt: true,
      buyerTaxNumber: true,
      type: true
    }
  });

  let smsPending = 0;
  let gecisErrors = 0;

  for (const inv of invoices) {
    const einv = readEInvoiceMeta(inv.metadata);
    const gibStatus = einv.status ?? (inv.eInvoiceUuid ? 'submitted' : '—');
    const lastError = einv.lastError ?? null;
    const classified = classifyGibError(lastError);
    const eligibility = evaluateGibSendEligibility({
      issuedAt: inv.issuedAt,
      invoiceType: inv.type,
      buyerTaxNumber: inv.buyerTaxNumber,
      lastError
    });

    if (Boolean(einv.needsSmsSign) || gibStatus === 'submitted') {
      smsPending += 1;
    }
    if (classified?.category === 'gecis_tarih' || eligibility.issuedOutsideGecis) {
      gecisErrors += 1;
    }
  }

  return {
    smsPending,
    gecisErrors,
    /** Rozet: SMS + GEÇİŞ birleşik uyarı sayısı */
    faturalarBadge: smsPending + gecisErrors
  };
}

/** Vergi sekmesi için kısa KDV özeti. */
export async function getAccountingVatSummary() {
  await ensureDbConnection();

  const issued = await prisma.invoice.aggregate({
    where: { status: 'issued', type: { not: 'credit_note' } },
    _sum: { subtotalNet: true, vatAmount: true, totalGross: true },
    _count: true
  });

  return {
    invoiceCount: issued._count,
    subtotalNet: issued._sum.subtotalNet ?? 0,
    vatAmount: issued._sum.vatAmount ?? 0,
    totalGross: issued._sum.totalGross ?? 0,
    defaultVatRate: companyLegal.defaultVatRate
  };
}

export async function getAccountingInvoices(limit = 100) {
  await ensureDbConnection();
  return prisma.invoice.findMany({
    orderBy: { issuedAt: 'desc' },
    take: limit,
    include: {
      lines: true,
      order: { select: { id: true, event: { select: { title: true } } } },
      user: { select: { email: true, displayName: true } }
    }
  });
}

export async function getAccountingEmailDeliveries(limit = 50) {
  await ensureDbConnection();
  return prisma.emailDelivery.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

export async function getAccountingPayouts(limit = 50) {
  await ensureDbConnection();
  return prisma.organizerPayout.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      organizer: { select: { name: true } },
      event: { select: { title: true } }
    }
  });
}

export async function getAccountingExpenses(limit = 50) {
  return listAccountingExpenses({ limit });
}

export async function getAccountingReconciliations(limit = 50) {
  await ensureDbConnection();
  return prisma.paymentReconciliation.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { order: { select: { id: true } } }
  });
}

export async function getAccountingAuditLogs(limit = 80) {
  await ensureDbConnection();
  return prisma.accountingAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

type TicketCategoryBreakdown = {
  ticketTypeId: string;
  name: string;
  unitPrice: number;
  soldCount: number;
  invitationCount: number;
  soldRevenue: number;
  capacity: number;
};

type EventFinancialRow = {
  eventId: string;
  eventTitle: string;
  startDate: Date;
  endDate: Date;
  status: string;
  paidOrderCount: number;
  ticketsSold: number;
  invitationsSent: number;
  grossSales: number;
  organizerRevenue: number;
  serviceFee: number;
  vatAmount: number;
  vatRate: number;
  paymentReceived: number;
  payoutNet: number;
  payoutPaid: number;
  payoutPending: number;
};

export async function getAccountingOrganizersOverview() {
  await ensureDbConnection();

  const organizers = await prisma.organizer.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { email: true, displayName: true } },
      _count: { select: { events: true } }
    }
  });

  const organizerIds = organizers.map((o) => o.id);
  if (organizerIds.length === 0) return [];

  const [orders, payouts, reconciliations] = await Promise.all([
    prisma.order.findMany({
      where: { organizerId: { in: organizerIds }, status: 'paid', deletedAt: null },
      select: { organizerId: true, total: true, subtotal: true, commission: true }
    }),
    prisma.organizerPayout.findMany({
      where: { organizerId: { in: organizerIds } },
      select: { organizerId: true, netAmount: true, status: true }
    }),
    prisma.paymentReconciliation.findMany({
      where: { order: { organizerId: { in: organizerIds } } },
      select: { netAmount: true, status: true, order: { select: { organizerId: true } } }
    })
  ]);

  const orderMap = new Map<
    string,
    { grossSales: number; organizerRevenue: number; serviceFee: number; paidOrderCount: number }
  >();
  for (const row of orders) {
    const current = orderMap.get(row.organizerId) ?? {
      grossSales: 0,
      organizerRevenue: 0,
      serviceFee: 0,
      paidOrderCount: 0
    };
    current.grossSales += row.total;
    current.organizerRevenue += row.subtotal;
    current.serviceFee += row.commission;
    current.paidOrderCount += 1;
    orderMap.set(row.organizerId, current);
  }

  const payoutMap = new Map<string, { payoutNet: number; payoutPaid: number; payoutPending: number }>();
  for (const row of payouts) {
    const current = payoutMap.get(row.organizerId) ?? {
      payoutNet: 0,
      payoutPaid: 0,
      payoutPending: 0
    };
    current.payoutNet += row.netAmount;
    if (row.status === 'paid') current.payoutPaid += row.netAmount;
    if (row.status === 'pending' || row.status === 'scheduled') current.payoutPending += row.netAmount;
    payoutMap.set(row.organizerId, current);
  }

  const paymentMap = new Map<string, number>();
  for (const row of reconciliations) {
    if (row.status !== 'reconciled') continue;
    const organizerId = row.order.organizerId;
    paymentMap.set(organizerId, (paymentMap.get(organizerId) ?? 0) + row.netAmount);
  }

  const vatRate = companyLegal.defaultVatRate;
  const defaultCommissionRate = await resolveOrganizerCommissionRate(null);

  return organizers.map((o) => {
    const orderAgg = orderMap.get(o.id) ?? {
      grossSales: 0,
      organizerRevenue: 0,
      serviceFee: 0,
      paidOrderCount: 0
    };
    const payoutAgg = payoutMap.get(o.id) ?? { payoutNet: 0, payoutPaid: 0, payoutPending: 0 };
    const paymentReceived = paymentMap.get(o.id) ?? 0;
    const commissionRate = o.commissionRate ?? defaultCommissionRate;
    const vat = splitGrossAmount(orderAgg.grossSales, vatRate);

    return {
      organizerId: o.id,
      organizerName: o.name,
      organizerSlug: o.slug,
      ownerName: o.owner.displayName,
      ownerEmail: o.owner.email,
      eventCount: o._count.events,
      paidOrderCount: orderAgg.paidOrderCount,
      grossSales: orderAgg.grossSales,
      organizerRevenue: orderAgg.organizerRevenue,
      serviceFee: orderAgg.serviceFee,
      commissionRate,
      commissionRatePercent: formatCommissionRatePercent(commissionRate),
      commissionRateCustom: o.commissionRate != null,
      vatAmount: vat.vatAmount,
      vatRate: vat.vatRate,
      paymentReceived,
      payoutNet: payoutAgg.payoutNet,
      payoutPaid: payoutAgg.payoutPaid,
      payoutPending: payoutAgg.payoutPending
    };
  });
}

export async function getAccountingOrganizerDetail(organizerId: string) {
  await ensureDbConnection();

  const organizer = await prisma.organizer.findFirst({
    where: { id: organizerId, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      commissionRate: true,
      createdAt: true,
      owner: { select: { email: true, displayName: true } }
    }
  });
  if (!organizer) return null;

  const effectiveCommissionRate = await resolveOrganizerCommissionRate(organizer.commissionRate);
  const vatRate = companyLegal.defaultVatRate;

  const events = await prisma.event.findMany({
    where: { organizerId, deletedAt: null },
    orderBy: { startDate: 'desc' },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      status: true
    }
  });

  const eventIds = events.map((e) => e.id);
  if (eventIds.length === 0) {
    return {
      organizer: {
        ...organizer,
        effectiveCommissionRate,
        commissionRatePercent: formatCommissionRatePercent(effectiveCommissionRate),
        commissionRateCustom: organizer.commissionRate != null
      },
      vatRate,
      upcomingEvents: [] as EventFinancialRow[],
      pastEvents: [] as EventFinancialRow[]
    };
  }

  const [orders, payouts, reconciliations, ticketSoldByEvent, invitationsByEvent] =
    await Promise.all([
      prisma.order.findMany({
        where: { organizerId, eventId: { in: eventIds }, status: 'paid', deletedAt: null },
        select: { eventId: true, total: true, subtotal: true, commission: true }
      }),
      prisma.organizerPayout.findMany({
        where: { organizerId, eventId: { in: eventIds } },
        select: { eventId: true, netAmount: true, status: true }
      }),
      prisma.paymentReconciliation.findMany({
        where: { order: { organizerId, eventId: { in: eventIds } } },
        select: { netAmount: true, status: true, order: { select: { eventId: true } } }
      }),
      prisma.purchasedTicket.groupBy({
        by: ['eventId'],
        where: {
          eventId: { in: eventIds },
          deletedAt: null,
          status: { in: ['VALID', 'USED'] },
          invitation: { is: null }
        },
        _count: { _all: true }
      }),
      prisma.eventInvitation.groupBy({
        by: ['eventId'],
        where: { eventId: { in: eventIds }, deletedAt: null },
        _count: { _all: true }
      })
    ]);

  const orderMap = new Map<
    string,
    { grossSales: number; organizerRevenue: number; serviceFee: number; count: number }
  >();
  for (const row of orders) {
    const current = orderMap.get(row.eventId) ?? {
      grossSales: 0,
      organizerRevenue: 0,
      serviceFee: 0,
      count: 0
    };
    current.grossSales += row.total;
    current.organizerRevenue += row.subtotal;
    current.serviceFee += row.commission;
    current.count += 1;
    orderMap.set(row.eventId, current);
  }

  const payoutMap = new Map<string, { payoutNet: number; payoutPaid: number; payoutPending: number }>();
  for (const row of payouts) {
    const current = payoutMap.get(row.eventId) ?? {
      payoutNet: 0,
      payoutPaid: 0,
      payoutPending: 0
    };
    current.payoutNet += row.netAmount;
    if (row.status === 'paid') current.payoutPaid += row.netAmount;
    if (row.status === 'pending' || row.status === 'scheduled') current.payoutPending += row.netAmount;
    payoutMap.set(row.eventId, current);
  }

  const paymentMap = new Map<string, number>();
  for (const row of reconciliations) {
    if (row.status !== 'reconciled') continue;
    const eventId = row.order.eventId;
    paymentMap.set(eventId, (paymentMap.get(eventId) ?? 0) + row.netAmount);
  }

  const soldMap = new Map(ticketSoldByEvent.map((r) => [r.eventId, r._count._all]));
  const inviteMap = new Map(invitationsByEvent.map((r) => [r.eventId, r._count._all]));

  const now = Date.now();
  const rows: EventFinancialRow[] = events.map((event) => {
    const orderAgg = orderMap.get(event.id) ?? {
      grossSales: 0,
      organizerRevenue: 0,
      serviceFee: 0,
      count: 0
    };
    const payoutAgg = payoutMap.get(event.id) ?? { payoutNet: 0, payoutPaid: 0, payoutPending: 0 };
    const vat = splitGrossAmount(orderAgg.grossSales, vatRate);
    return {
      eventId: event.id,
      eventTitle: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      paidOrderCount: orderAgg.count,
      ticketsSold: soldMap.get(event.id) ?? 0,
      invitationsSent: inviteMap.get(event.id) ?? 0,
      grossSales: orderAgg.grossSales,
      organizerRevenue: orderAgg.organizerRevenue,
      serviceFee: orderAgg.serviceFee,
      vatAmount: vat.vatAmount,
      vatRate: vat.vatRate,
      paymentReceived: paymentMap.get(event.id) ?? 0,
      payoutNet: payoutAgg.payoutNet,
      payoutPaid: payoutAgg.payoutPaid,
      payoutPending: payoutAgg.payoutPending
    };
  });

  return {
    organizer: {
      ...organizer,
      effectiveCommissionRate,
      commissionRatePercent: formatCommissionRatePercent(effectiveCommissionRate),
      commissionRateCustom: organizer.commissionRate != null
    },
    vatRate,
    upcomingEvents: rows.filter((row) => row.startDate.getTime() >= now),
    pastEvents: rows.filter((row) => row.startDate.getTime() < now)
  };
}

export async function getAccountingOrganizerEventDetail(organizerId: string, eventId: string) {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      status: true,
      organizer: {
        select: { id: true, name: true, commissionRate: true }
      },
      ticketTypes: {
        where: { deletedAt: null },
        orderBy: { price: 'asc' },
        select: {
          id: true,
          name: true,
          price: true,
          sold: true,
          capacity: true,
          quantity: true
        }
      }
    }
  });
  if (!event) return null;

  const effectiveCommissionRate = await resolveOrganizerCommissionRate(
    event.organizer.commissionRate
  );
  const vatRate = companyLegal.defaultVatRate;

  const [orders, payouts, reconciliations, invitationsByType, paidTicketsByType, pnl, expenses] =
    await Promise.all([
      prisma.order.findMany({
        where: { organizerId, eventId, status: 'paid', deletedAt: null },
        orderBy: { paidAt: 'desc' },
        include: {
          user: { select: { displayName: true, email: true } },
          items: {
            include: { ticketType: { select: { id: true, name: true } } }
          }
        }
      }),
      prisma.organizerPayout.findMany({
        where: { organizerId, eventId },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.paymentReconciliation.findMany({
        where: { order: { organizerId, eventId } },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.eventInvitation.groupBy({
        by: ['ticketTypeId'],
        where: { eventId, deletedAt: null },
        _count: { _all: true }
      }),
      prisma.purchasedTicket.groupBy({
        by: ['ticketTypeId'],
        where: {
          eventId,
          deletedAt: null,
          status: { in: ['VALID', 'USED'] },
          invitation: { is: null }
        },
        _count: { _all: true }
      }),
      getEventProfitAndLoss(eventId),
      listAccountingExpenses({ eventId, limit: 50 })
    ]);

  const inviteCountMap = new Map(invitationsByType.map((r) => [r.ticketTypeId, r._count._all]));
  const soldCountMap = new Map(paidTicketsByType.map((r) => [r.ticketTypeId, r._count._all]));

  const categories: TicketCategoryBreakdown[] = event.ticketTypes.map((tt) => {
    const soldCount = soldCountMap.get(tt.id) ?? tt.sold;
    const invitationCount = inviteCountMap.get(tt.id) ?? 0;
    return {
      ticketTypeId: tt.id,
      name: tt.name,
      unitPrice: tt.price,
      soldCount,
      invitationCount,
      soldRevenue: Math.round(soldCount * tt.price * 100) / 100,
      capacity: tt.capacity || tt.quantity
    };
  });

  const grossSales = orders.reduce((sum, row) => sum + row.total, 0);
  const organizerRevenue = orders.reduce((sum, row) => sum + row.subtotal, 0);
  const serviceFee = orders.reduce((sum, row) => sum + row.commission, 0);
  const vat = splitGrossAmount(grossSales, vatRate);

  const payoutNet = payouts.reduce((sum, row) => sum + row.netAmount, 0);
  const payoutPaid = payouts
    .filter((row) => row.status === 'paid')
    .reduce((sum, row) => sum + row.netAmount, 0);
  const payoutPending = payouts
    .filter((row) => row.status === 'pending' || row.status === 'scheduled')
    .reduce((sum, row) => sum + row.netAmount, 0);
  const paymentReceived = reconciliations
    .filter((row) => row.status === 'reconciled')
    .reduce((sum, row) => sum + row.netAmount, 0);

  const ticketsSold = categories.reduce((sum, c) => sum + c.soldCount, 0);
  const invitationsSent = categories.reduce((sum, c) => sum + c.invitationCount, 0);

  return {
    event: {
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      organizer: {
        id: event.organizer.id,
        name: event.organizer.name
      }
    },
    rates: {
      vatRate,
      commissionRate: effectiveCommissionRate,
      commissionRatePercent: formatCommissionRatePercent(effectiveCommissionRate),
      commissionRateCustom: event.organizer.commissionRate != null
    },
    metrics: {
      paidOrderCount: orders.length,
      ticketsSold,
      invitationsSent,
      grossSales,
      organizerRevenue,
      serviceFee,
      vatAmount: vat.vatAmount,
      vatRate: vat.vatRate,
      paymentReceived,
      payoutNet,
      payoutPaid,
      payoutPending
    },
    categories,
    recentOrders: orders.map((row) => ({
      id: row.id,
      buyerName: row.attendeeName || row.user.displayName || row.user.email,
      paidAt: row.paidAt ?? row.createdAt,
      subtotal: row.subtotal,
      serviceFee: row.commission,
      total: row.total,
      status: row.status,
      paymentProvider: row.paymentProvider,
      categories: row.items.map((item) => ({
        name: item.ticketType.name,
        quantity: item.quantity
      }))
    })),
    payouts: payouts.map((row) => ({
      id: row.id,
      grossAmount: row.grossAmount,
      commissionAmount: row.commissionAmount,
      netAmount: row.netAmount,
      status: row.status,
      scheduledAt: row.scheduledAt,
      paidAt: row.paidAt,
      paymentRef: row.paymentRef,
      ibanSnapshot: row.ibanSnapshot,
      createdAt: row.createdAt
    })),
    reconciliations: reconciliations.map((row) => ({
      id: row.id,
      provider: row.provider,
      expectedAmount: row.expectedAmount,
      receivedAmount: row.receivedAmount,
      netAmount: row.netAmount,
      status: row.status,
      reconciledAt: row.reconciledAt,
      createdAt: row.createdAt
    })),
    pnl: pnl
      ? {
          revenue: pnl.revenue,
          commission: pnl.commission,
          payoutNet: pnl.payoutNet,
          payoutPaid: pnl.payoutPaid,
          payoutPending: pnl.payoutPending,
          expenseTotal: pnl.expenseTotal,
          expenseVat: pnl.expenseVat,
          expenseByCategory: pnl.expenseByCategory,
          platformNet: pnl.platformNet,
          organizerNet: pnl.organizerNet,
          discounts: pnl.discounts
        }
      : null,
    expenses: expenses.map((row) => ({
      id: row.id,
      category: row.category,
      description: row.description,
      amount: row.amount,
      vatAmount: row.vatAmount,
      currency: row.currency,
      incurredAt: row.incurredAt
    }))
  };
}
