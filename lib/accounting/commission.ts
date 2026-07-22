import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { logAccountingAudit } from '@/lib/accounting/audit';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Hakediş tutarları: tahsil edilen (order.total) brüt kabul edilir.
 * Komisyon, indirim sonrası tahsilata orantılanır — indirim organizatörü fazla ödemez.
 */
export function computePayoutAmounts(params: {
  subtotal: number;
  total: number;
  commission: number;
}): { grossAmount: number; commissionAmount: number; netAmount: number } {
  const grossAmount = round2(Math.max(0, params.total));
  const subtotal = Math.max(0, params.subtotal);
  const scale = subtotal > 0 ? Math.min(1, grossAmount / subtotal) : 0;
  const commissionAmount = round2(Math.max(0, params.commission) * scale);
  const netAmount = round2(Math.max(0, grossAmount - commissionAmount));
  return { grossAmount, commissionAmount, netAmount };
}

export async function scheduleOrganizerPayout(params: {
  orderId: string;
  organizerId: string;
  eventId: string;
  /** Prefer passing order totals via computePayoutAmounts */
  grossAmount: number;
  commissionAmount: number;
  currency?: 'TRY' | 'USD' | 'EUR';
}) {
  await ensureDbConnection();

  const existing = await prisma.organizerPayout.findFirst({
    where: { orderId: params.orderId }
  });
  if (existing) return existing;

  const netAmount = round2(params.grossAmount - params.commissionAmount);

  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: { endDate: true }
  });

  const payout = await prisma.organizerPayout.create({
    data: {
      orderId: params.orderId,
      organizerId: params.organizerId,
      eventId: params.eventId,
      grossAmount: params.grossAmount,
      commissionAmount: params.commissionAmount,
      netAmount,
      currency: params.currency ?? 'TRY',
      status: 'scheduled',
      scheduledAt: event?.endDate ?? new Date()
    }
  });

  await logAccountingAudit({
    action: 'payout.scheduled',
    entityType: 'organizer_payout',
    entityId: payout.id,
    after: { netAmount, scheduledAt: payout.scheduledAt }
  });

  return payout;
}

export async function markPayoutPaid(params: {
  payoutId: string;
  paymentRef: string;
  paidBy: string;
  ibanSnapshot?: string | null;
}) {
  await ensureDbConnection();

  const payout = await prisma.organizerPayout.findUnique({
    where: { id: params.payoutId },
    include: {
      organizer: {
        select: {
          billingProfiles: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: { iban: true }
          }
        }
      }
    }
  });

  if (!payout) throw new Error('Hakediş kaydı bulunamadı');
  if (payout.status === 'paid') return payout;
  if (payout.status === 'cancelled' || payout.status === 'failed') {
    throw new Error('İptal veya başarısız hakediş ödenemez');
  }
  if (payout.status !== 'pending' && payout.status !== 'scheduled') {
    throw new Error('Yalnızca bekleyen/planlı hakedişler ödenebilir');
  }

  const paymentRef = params.paymentRef.trim();
  if (!paymentRef) throw new Error('Ödeme referansı zorunlu');

  const ibanSnapshot =
    params.ibanSnapshot?.trim() ||
    payout.ibanSnapshot ||
    payout.organizer.billingProfiles[0]?.iban ||
    null;

  const updated = await prisma.organizerPayout.update({
    where: { id: payout.id },
    data: {
      status: 'paid',
      paidAt: new Date(),
      paymentRef,
      paidBy: params.paidBy,
      ibanSnapshot
    }
  });

  await logAccountingAudit({
    action: 'payout.paid',
    entityType: 'organizer_payout',
    entityId: updated.id,
    actorId: params.paidBy,
    before: { status: payout.status },
    after: {
      status: 'paid',
      paymentRef,
      ibanSnapshot,
      netAmount: updated.netAmount
    }
  });

  return updated;
}

export async function cancelPayout(params: {
  payoutId: string;
  actorId?: string;
  reason?: string;
}) {
  await ensureDbConnection();

  const payout = await prisma.organizerPayout.findUnique({
    where: { id: params.payoutId }
  });
  if (!payout) throw new Error('Hakediş kaydı bulunamadı');
  if (payout.status === 'cancelled') return payout;
  if (payout.status === 'paid') {
    throw new Error('Ödenmiş hakediş iptal edilemez');
  }

  const updated = await prisma.organizerPayout.update({
    where: { id: payout.id },
    data: {
      status: 'cancelled',
      metadata: {
        ...(typeof payout.metadata === 'object' &&
        payout.metadata !== null &&
        !Array.isArray(payout.metadata)
          ? (payout.metadata as Record<string, unknown>)
          : {}),
        cancelReason: params.reason ?? 'manual_cancel',
        cancelledAt: new Date().toISOString()
      }
    }
  });

  await logAccountingAudit({
    action: 'payout.cancelled',
    entityType: 'organizer_payout',
    entityId: updated.id,
    actorId: params.actorId,
    before: { status: payout.status },
    after: { status: 'cancelled', reason: params.reason ?? 'manual_cancel' }
  });

  return updated;
}

/** İade: siparişe bağlı bekleyen/planlı hakedişleri iptal et */
export async function cancelPayoutsForOrder(orderId: string, reason = 'order_refund') {
  await ensureDbConnection();

  const payouts = await prisma.organizerPayout.findMany({
    where: {
      orderId,
      status: { in: ['pending', 'scheduled'] }
    }
  });

  const results = [];
  for (const payout of payouts) {
    results.push(
      await cancelPayout({
        payoutId: payout.id,
        reason
      })
    );
  }
  return results;
}
