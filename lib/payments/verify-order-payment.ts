import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { logPaymentAudit } from '@/lib/payments/payment-audit';

const AMOUNT_TOLERANCE = 0.01;

/** Callback sonrası ödenen tutarın sipariş toplamıyla eşleşmesini doğrular */
export async function verifyOrderPaymentAmount(params: {
  orderId: string;
  amount?: number;
  currency?: string;
  provider: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (params.amount === undefined) {
    return { ok: true };
  }

  await ensureDbConnection();
  const order = await prisma.order.findFirst({
    where: { id: params.orderId, deletedAt: null },
    select: { total: true }
  });

  if (!order) {
    return { ok: false, reason: 'Sipariş bulunamadı' };
  }

  if (params.currency && params.currency !== 'TRY') {
    logPaymentAudit('callback_amount_mismatch', {
      orderId: params.orderId,
      provider: params.provider,
      reason: 'currency',
      expected: 'TRY',
      received: params.currency
    });
    return { ok: false, reason: 'Para birimi uyuşmazlığı' };
  }

  if (Math.abs(params.amount - order.total) > AMOUNT_TOLERANCE) {
    logPaymentAudit('callback_amount_mismatch', {
      orderId: params.orderId,
      provider: params.provider,
      expected: order.total,
      received: params.amount
    });
    return { ok: false, reason: 'Tutar uyuşmazlığı' };
  }

  return { ok: true };
}
