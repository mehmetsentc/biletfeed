import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { companyLegal } from '@/lib/config/company';

export async function getAccountingSummary() {
  await ensureDbConnection();

  const [
    invoiceCount,
    invoiceTotal,
    pendingPayouts,
    deferredRevenue,
    emailFailed,
    reconciledCount
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
    prisma.paymentReconciliation.count({ where: { status: 'reconciled' } })
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
    reconciledCount
  };
}

export async function getAccountingInvoices(limit = 50) {
  await ensureDbConnection();
  return prisma.invoice.findMany({
    orderBy: { issuedAt: 'desc' },
    take: limit,
    include: {
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
