import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { logPaymentAudit } from '@/lib/payments/payment-audit';

const AMOUNT_TOLERANCE = 0.01;

/** Callback sonrası ödenen tutarın sipariş (veya sepet grubu) toplamıyla eşleşmesini doğrular */
export async function verifyOrderPaymentAmount(params: {
  orderId: string;
  amount?: number;
  currency?: string;
  provider: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (params.amount === undefined) {
    // Bazı sağlayıcılar (Tosla vb.) callback'te Amount göndermez.
    // Hash doğrulaması güvenliği zaten sağlar; amount yoksa geç.
    return { ok: true };
  }

  await ensureDbConnection();
  const order = await prisma.order.findFirst({
    where: { id: params.orderId, deletedAt: null },
    select: { total: true, cartGroupId: true }
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

  let expected = order.total;
  if (order.cartGroupId) {
    const siblings = await prisma.order.findMany({
      where: { cartGroupId: order.cartGroupId, deletedAt: null },
      select: { total: true }
    });
    expected =
      Math.round(siblings.reduce((sum, s) => sum + s.total, 0) * 100) / 100;
  }

  if (Math.abs(params.amount - expected) > AMOUNT_TOLERANCE) {
    logPaymentAudit('callback_amount_mismatch', {
      orderId: params.orderId,
      provider: params.provider,
      expected,
      received: params.amount
    });
    return { ok: false, reason: 'Tutar uyuşmazlığı' };
  }

  return { ok: true };
}
