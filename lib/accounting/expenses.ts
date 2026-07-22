import type { AccountingExpenseCategory, Currency, Prisma } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { logAccountingAudit } from '@/lib/accounting/audit';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type CreateExpenseInput = {
  description: string;
  amount: number;
  category?: AccountingExpenseCategory;
  vatAmount?: number;
  currency?: Currency;
  eventId?: string | null;
  organizerId?: string | null;
  incurredAt?: Date;
  metadata?: Prisma.InputJsonValue;
  actorId?: string;
};

export type UpdateExpenseInput = {
  id: string;
  description?: string;
  amount?: number;
  category?: AccountingExpenseCategory;
  vatAmount?: number;
  currency?: Currency;
  eventId?: string | null;
  organizerId?: string | null;
  incurredAt?: Date;
  metadata?: Prisma.InputJsonValue;
  actorId?: string;
};

export async function listAccountingExpenses(params?: {
  eventId?: string;
  organizerId?: string;
  limit?: number;
}) {
  await ensureDbConnection();
  const where: Prisma.AccountingExpenseWhereInput = {};
  if (params?.eventId) where.eventId = params.eventId;
  if (params?.organizerId) where.organizerId = params.organizerId;

  return prisma.accountingExpense.findMany({
    where,
    orderBy: { incurredAt: 'desc' },
    take: params?.limit ?? 100,
    include: {
      event: { select: { id: true, title: true } },
      organizer: { select: { id: true, name: true } }
    }
  });
}

export async function createAccountingExpense(input: CreateExpenseInput) {
  await ensureDbConnection();

  const description = input.description.trim();
  if (!description) throw new Error('Açıklama zorunlu');
  if (!(input.amount > 0)) throw new Error('Tutar pozitif olmalı');

  if (input.eventId) {
    const event = await prisma.event.findFirst({
      where: { id: input.eventId, deletedAt: null },
      select: { id: true, organizerId: true }
    });
    if (!event) throw new Error('Etkinlik bulunamadı');
    if (!input.organizerId) input.organizerId = event.organizerId;
  }

  if (input.organizerId) {
    const org = await prisma.organizer.findFirst({
      where: { id: input.organizerId, deletedAt: null },
      select: { id: true }
    });
    if (!org) throw new Error('Organizatör bulunamadı');
  }

  const expense = await prisma.accountingExpense.create({
    data: {
      description,
      amount: round2(input.amount),
      vatAmount: round2(input.vatAmount ?? 0),
      category: input.category ?? 'other',
      currency: input.currency ?? 'TRY',
      eventId: input.eventId ?? null,
      organizerId: input.organizerId ?? null,
      incurredAt: input.incurredAt ?? new Date(),
      metadata: input.metadata ?? {}
    }
  });

  await logAccountingAudit({
    action: 'expense.created',
    entityType: 'accounting_expense',
    entityId: expense.id,
    actorId: input.actorId,
    after: {
      amount: expense.amount,
      category: expense.category,
      eventId: expense.eventId,
      organizerId: expense.organizerId
    }
  });

  return expense;
}

export async function updateAccountingExpense(input: UpdateExpenseInput) {
  await ensureDbConnection();

  const existing = await prisma.accountingExpense.findUnique({
    where: { id: input.id }
  });
  if (!existing) throw new Error('Gider kaydı bulunamadı');

  if (input.amount != null && !(input.amount > 0)) {
    throw new Error('Tutar pozitif olmalı');
  }
  if (input.description != null && !input.description.trim()) {
    throw new Error('Açıklama zorunlu');
  }

  const updated = await prisma.accountingExpense.update({
    where: { id: input.id },
    data: {
      ...(input.description != null
        ? { description: input.description.trim() }
        : {}),
      ...(input.amount != null ? { amount: round2(input.amount) } : {}),
      ...(input.vatAmount != null ? { vatAmount: round2(input.vatAmount) } : {}),
      ...(input.category != null ? { category: input.category } : {}),
      ...(input.currency != null ? { currency: input.currency } : {}),
      ...(input.eventId !== undefined ? { eventId: input.eventId } : {}),
      ...(input.organizerId !== undefined
        ? { organizerId: input.organizerId }
        : {}),
      ...(input.incurredAt != null ? { incurredAt: input.incurredAt } : {}),
      ...(input.metadata != null ? { metadata: input.metadata } : {})
    }
  });

  await logAccountingAudit({
    action: 'expense.updated',
    entityType: 'accounting_expense',
    entityId: updated.id,
    actorId: input.actorId,
    before: {
      amount: existing.amount,
      description: existing.description,
      category: existing.category
    },
    after: {
      amount: updated.amount,
      description: updated.description,
      category: updated.category
    }
  });

  return updated;
}

export async function deleteAccountingExpense(params: {
  id: string;
  actorId?: string;
}) {
  await ensureDbConnection();

  const existing = await prisma.accountingExpense.findUnique({
    where: { id: params.id }
  });
  if (!existing) throw new Error('Gider kaydı bulunamadı');

  await prisma.accountingExpense.delete({ where: { id: params.id } });

  await logAccountingAudit({
    action: 'expense.deleted',
    entityType: 'accounting_expense',
    entityId: params.id,
    actorId: params.actorId,
    before: {
      amount: existing.amount,
      description: existing.description,
      category: existing.category
    }
  });

  return { ok: true as const };
}

/** Etkinlik P&L: gelir, komisyon, hakediş, gider, net */
export async function getEventProfitAndLoss(eventId: string) {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      organizerId: true,
      organizer: { select: { id: true, name: true } }
    }
  });
  if (!event) return null;

  const [orders, payouts, expenses] = await Promise.all([
    prisma.order.findMany({
      where: { eventId, status: 'paid', deletedAt: null },
      select: { total: true, subtotal: true, commission: true, discount: true }
    }),
    prisma.organizerPayout.findMany({
      where: { eventId, status: { not: 'cancelled' } },
      select: { grossAmount: true, commissionAmount: true, netAmount: true, status: true }
    }),
    prisma.accountingExpense.findMany({
      where: { eventId },
      select: { amount: true, vatAmount: true, category: true }
    })
  ]);

  const revenue = round2(orders.reduce((s, o) => s + o.total, 0));
  const organizerSubtotal = round2(orders.reduce((s, o) => s + o.subtotal, 0));
  const discounts = round2(orders.reduce((s, o) => s + o.discount, 0));
  const commissionFromPayouts = payouts.reduce((s, p) => s + p.commissionAmount, 0);
  const commissionFromOrders = orders.reduce((s, o) => s + o.commission, 0);
  const commission = round2(
    payouts.length > 0 ? commissionFromPayouts : commissionFromOrders
  );
  const payoutNet = round2(
    payouts
      .filter((p) => p.status === 'pending' || p.status === 'scheduled' || p.status === 'paid')
      .reduce((s, p) => s + p.netAmount, 0)
  );
  const payoutPaid = round2(
    payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.netAmount, 0)
  );
  const payoutPending = round2(
    payouts
      .filter((p) => p.status === 'pending' || p.status === 'scheduled')
      .reduce((s, p) => s + p.netAmount, 0)
  );
  const expenseTotal = round2(expenses.reduce((s, e) => s + e.amount, 0));
  const expenseVat = round2(expenses.reduce((s, e) => s + e.vatAmount, 0));

  const expenseByCategory: Record<string, number> = {};
  for (const e of expenses) {
    expenseByCategory[e.category] = round2(
      (expenseByCategory[e.category] ?? 0) + e.amount
    );
  }

  /** Platform net: komisyon − platform giderleri */
  const platformNet = round2(commission - expenseTotal);
  /** Organizatör net tahmini: hakediş − etkinlik giderleri (organizatör gideri varsa) */
  const organizerNet = round2(payoutNet - expenseTotal);

  return {
    event,
    revenue,
    organizerSubtotal,
    discounts,
    commission,
    payoutNet,
    payoutPaid,
    payoutPending,
    expenseTotal,
    expenseVat,
    expenseByCategory,
    platformNet,
    organizerNet,
    paidOrderCount: orders.length,
    expenseCount: expenses.length
  };
}
