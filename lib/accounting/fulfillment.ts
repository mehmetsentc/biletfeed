import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { createSaleInvoice } from '@/lib/accounting/invoice';
import { reconcilePayment } from '@/lib/accounting/reconciliation';
import {
  computePayoutAmounts,
  scheduleOrganizerPayout
} from '@/lib/accounting/commission';
import { deferRevenueRecognition } from '@/lib/accounting/revenue';
import { sendInvoiceEmail } from '@/lib/accounting/email';
import { submitInvoiceToGib } from '@/lib/accounting/einvoice';

/**
 * Ödeme tamamlandıktan sonra muhasebe işlemlerini çalıştırır.
 * Sipariş transaction'ı dışında çağrılmalıdır.
 */
export async function processOrderAccounting(orderId: string): Promise<void> {
  await ensureDbConnection();

  const order = await prisma.order.findFirst({
    where: { id: orderId, status: 'paid', deletedAt: null },
    include: {
      user: { include: { billingProfile: true } },
      event: { select: { title: true, startDate: true, endDate: true } },
      items: { include: { ticketType: { select: { name: true } } } }
    }
  });

  if (!order) return;

  const alreadyInvoiced = await prisma.invoice.findFirst({
    where: { orderId, status: 'issued' }
  });
  if (alreadyInvoiced) return;

  const profile = order.user.billingProfile;
  const buyerName =
    profile?.companyName?.trim() ||
    order.attendeeName?.trim() ||
    order.user.displayName?.trim() ||
    'Bireysel Müşteri';

  const invoice = await createSaleInvoice({
    orderId: order.id,
    userId: order.userId,
    buyerName,
    buyerTaxNumber: profile?.taxNumber,
    buyerTaxOffice: profile?.taxOffice,
    buyerAddress: profile?.billingAddress,
    totalGross: order.total,
    currency: 'TRY',
    lines: order.items.map((item) => ({
      description: `${order.event.title} — ${item.ticketType.name}`,
      quantity: item.quantity,
      unitPriceGross: item.unitPrice
    }))
  });

  // GİB e-belge gönderimi (entegratör / mock). Hata siparişi bozmaz (failSoft).
  await submitInvoiceToGib({
    invoiceId: invoice.id,
    buyerEmail: order.user.email ?? order.attendeeEmail
  });

  await reconcilePayment({
    orderId: order.id,
    provider: order.paymentProvider,
    providerRef: order.paymentId,
    expectedAmount: order.total
  });

  const payoutAmounts = computePayoutAmounts({
    subtotal: order.subtotal,
    total: order.total,
    commission: order.commission
  });

  await scheduleOrganizerPayout({
    orderId: order.id,
    organizerId: order.organizerId,
    eventId: order.eventId,
    grossAmount: payoutAmounts.grossAmount,
    commissionAmount: payoutAmounts.commissionAmount
  });

  await deferRevenueRecognition({
    orderId: order.id,
    amount: order.total,
    eventDate: order.event.endDate
  });

  if (order.user.email) {
    await sendInvoiceEmail({
      to: order.user.email,
      invoiceNumber: invoice.invoiceNumber,
      totalGross: invoice.totalGross,
      currency: invoice.currency,
      orderId: order.id,
      invoiceId: invoice.id,
      buyerName,
      eventTitle: order.event.title,
      issuedAt: invoice.issuedAt ?? undefined
    });
  }
}

export { createCreditNoteForRefund } from '@/lib/accounting/invoice';
export { processOrderRefundAccounting } from '@/lib/accounting/refund';
export { recognizeDueRevenue } from '@/lib/accounting/revenue';
export { logAccountingAudit } from '@/lib/accounting/audit';
