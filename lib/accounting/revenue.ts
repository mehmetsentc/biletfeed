import { prisma } from '@/lib/db/prisma';
import { logAccountingAudit } from '@/lib/accounting/audit';

/** Gelir tanıma: satış anında ertelenir, etkinlik tarihinde tanınır */
export async function deferRevenueRecognition(params: {
  orderId: string;
  amount: number;
  eventDate: Date;
  currency?: 'TRY' | 'USD' | 'EUR';
}) {
  const existing = await prisma.revenueRecognition.findFirst({
    where: { orderId: params.orderId }
  });
  if (existing) return existing;

  const row = await prisma.revenueRecognition.create({
    data: {
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency ?? 'TRY',
      eventDate: params.eventDate,
      status: 'deferred'
    }
  });

  await logAccountingAudit({
    action: 'revenue.deferred',
    entityType: 'revenue_recognition',
    entityId: row.id,
    after: { amount: params.amount, eventDate: params.eventDate }
  });

  return row;
}

/** Etkinlik tamamlandıktan sonra geliri tanı (cron veya manuel) */
export async function recognizeDueRevenue(): Promise<number> {
  const now = new Date();
  const due = await prisma.revenueRecognition.findMany({
    where: {
      status: 'deferred',
      eventDate: { lte: now }
    }
  });

  for (const entry of due) {
    await prisma.revenueRecognition.update({
      where: { id: entry.id },
      data: { status: 'recognized', recognizedAt: now }
    });
    await logAccountingAudit({
      action: 'revenue.recognized',
      entityType: 'revenue_recognition',
      entityId: entry.id,
      after: { amount: entry.amount }
    });
  }

  return due.length;
}

/** İade: ertelenmiş veya tanınmış geliri reversed durumuna alır */
export async function reverseRevenueForOrder(orderId: string) {
  const entries = await prisma.revenueRecognition.findMany({
    where: {
      orderId,
      status: { in: ['deferred', 'recognized'] }
    }
  });

  const now = new Date();
  const results = [];
  for (const entry of entries) {
    const updated = await prisma.revenueRecognition.update({
      where: { id: entry.id },
      data: { status: 'reversed' }
    });
    await logAccountingAudit({
      action: 'revenue.reversed',
      entityType: 'revenue_recognition',
      entityId: entry.id,
      before: { status: entry.status, amount: entry.amount },
      after: { status: 'reversed', reversedAt: now.toISOString() }
    });
    results.push(updated);
  }
  return results;
}
