import { prisma } from '@/lib/db/prisma';
import { logAccountingAudit } from '@/lib/accounting/audit';

/** Ödeme geçidi komisyon oranı tahmini — gerçek mutabakat raporuyla güncellenir */
const PROVIDER_FEE_RATES: Record<string, number> = {
  iyzico: 0.0289,
  paytr: 0.0299,
  stripe: 0.029,
  mock: 0,
  free: 0
};

export async function reconcilePayment(params: {
  orderId: string;
  provider: string;
  providerRef?: string | null;
  expectedAmount: number;
  receivedAmount?: number;
  currency?: 'TRY' | 'USD' | 'EUR';
}) {
  const existing = await prisma.paymentReconciliation.findFirst({
    where: { orderId: params.orderId }
  });
  if (existing) return existing;

  const received = params.receivedAmount ?? params.expectedAmount;
  const feeRate = PROVIDER_FEE_RATES[params.provider] ?? 0.03;
  const feeAmount = Math.round(received * feeRate * 100) / 100;
  const netAmount = Math.round((received - feeAmount) * 100) / 100;
  const status =
    Math.abs(received - params.expectedAmount) < 0.01
      ? 'reconciled'
      : 'mismatch';

  const row = await prisma.paymentReconciliation.create({
    data: {
      orderId: params.orderId,
      provider: params.provider,
      providerRef: params.providerRef ?? null,
      expectedAmount: params.expectedAmount,
      receivedAmount: received,
      feeAmount,
      netAmount,
      currency: params.currency ?? 'TRY',
      status,
      reconciledAt: status === 'reconciled' ? new Date() : null
    }
  });

  await logAccountingAudit({
    action: 'reconciliation.created',
    entityType: 'payment_reconciliation',
    entityId: row.id,
    after: { status, provider: params.provider, netAmount }
  });

  return row;
}
