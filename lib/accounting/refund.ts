import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { createCreditNoteForRefund } from '@/lib/accounting/invoice';
import { cancelPayoutsForOrder } from '@/lib/accounting/commission';
import { reverseRevenueForOrder } from '@/lib/accounting/revenue';
import { markReconciliationRefunded } from '@/lib/accounting/reconciliation';
import { logAccountingAudit } from '@/lib/accounting/audit';

/**
 * Sipariş iadesi muhasebe ters kayıtları:
 * credit note + orijinal e-belge iptal + hakediş iptali + gelir reverse + mutabakat
 */
export async function processOrderRefundAccounting(orderId: string): Promise<void> {
  await ensureDbConnection();

  const original = await prisma.invoice.findFirst({
    where: { orderId, status: 'issued', type: { not: 'credit_note' } },
    select: { id: true }
  });

  const credit = await createCreditNoteForRefund(orderId);

  if (original) {
    try {
      const { cancelInvoiceOnChannel } = await import(
        '@/lib/accounting/einvoice/cancel'
      );
      await cancelInvoiceOnChannel({
        invoiceId: original.id,
        reason: 'order_refund'
      });
    } catch (err) {
      console.error('[accounting] einvoice cancel', orderId, err);
    }
  }

  const cancelledPayouts = await cancelPayoutsForOrder(orderId, 'order_refund');
  const reversedRevenue = await reverseRevenueForOrder(orderId);
  await markReconciliationRefunded(orderId);

  await logAccountingAudit({
    action: 'refund.processed',
    entityType: 'order',
    entityId: orderId,
    after: {
      creditNoteId: credit?.id ?? null,
      cancelledInvoiceId: original?.id ?? null,
      cancelledPayoutCount: cancelledPayouts.length,
      reversedRevenueCount: reversedRevenue.length
    }
  });
}
