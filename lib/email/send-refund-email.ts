import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getSiteUrl } from '@/lib/config/domain';
import { queueEmail } from '@/lib/accounting/email';
import { buildRefundNotificationEmail } from '@/lib/email/refund-notification-template';

/** Sipariş iade sonrası müşteriye bildirim — idempotent */
export async function sendRefundNotificationEmail(
  orderId: string,
  reason?: string
): Promise<void> {
  await ensureDbConnection();

  const alreadySent = await prisma.emailDelivery.findFirst({
    where: { orderId, template: 'order_refund', status: 'sent' }
  });
  if (alreadySent) return;

  const order = await prisma.order.findFirst({
    where: { id: orderId, status: 'refunded', deletedAt: null },
    include: {
      user: { select: { email: true, displayName: true } },
      event: {
        select: { title: true, currency: true }
      }
    }
  });

  if (!order?.user.email) return;

  const currency = order.event?.currency ?? 'TRY';

  const html = buildRefundNotificationEmail({
    customerName: order.user.displayName?.trim() ?? '',
    eventTitle: order.event?.title ?? 'Etkinlik',
    orderNumber: order.id.slice(0, 8).toUpperCase(),
    refundAmount: order.total,
    currency,
    reason,
    ticketsUrl: getSiteUrl('/biletlerim')
  });

  await queueEmail({
    to: order.user.email,
    subject: `İade onayı — ${order.event?.title ?? 'Siparişiniz'}`,
    template: 'order_refund',
    html,
    orderId: order.id
  });
}
