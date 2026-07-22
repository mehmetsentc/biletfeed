import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { createCreditNoteForRefund } from '@/lib/accounting/invoice';
import { cancelPayoutsForOrder } from '@/lib/accounting/commission';
import { reverseRevenueForOrder } from '@/lib/accounting/revenue';
import { markReconciliationRefunded } from '@/lib/accounting/reconciliation';
import { logAccountingAudit } from '@/lib/accounting/audit';

/**
 * Sipariş iadesi muhasebe ters kayıtları:
 * credit note + hakediş iptali + gelir reverse + mutabakat işareti
 */
export async function processOrderRefundAccounting(orderId: string): Promise<void> {
  await ensureDbConnection();

  const credit = await createCreditNoteForRefund(orderId);
  const cancelledPayouts = await cancelPayoutsForOrder(orderId, 'order_refund');
  const reversedRevenue = await reverseRevenueForOrder(orderId);
  await markReconciliationRefunded(orderId);

  await logAccountingAudit({
    action: 'refund.processed',
    entityType: 'order',
    entityId: orderId,
    after: {
      creditNoteId: credit?.id ?? null,
      cancelledPayoutCount: cancelledPayouts.length,
      reversedRevenueCount: reversedRevenue.length
    }
  });
}
