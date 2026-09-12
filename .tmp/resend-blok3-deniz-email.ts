import { PrismaClient } from '@prisma/client';
import { sendTicketPurchaseEmail } from '../lib/email/send-ticket-purchase-email';

const prisma = new PrismaClient();
const PAID_ORDER_ID = '33a6a8bf-1c37-40e3-8892-43da41224558';

async function main() {
  const order = await prisma.order.findUnique({
    where: { id: PAID_ORDER_ID },
    select: {
      id: true,
      status: true,
      attendeeEmail: true,
      user: { select: { email: true, firebaseUid: true } },
      purchasedTickets: { select: { id: true, status: true, ticketCode: true } }
    }
  });
  console.log('order', JSON.stringify(order, null, 2));

  if (!order || order.status !== 'paid') {
    console.error('Order not paid; skip email');
    return;
  }

  await sendTicketPurchaseEmail(PAID_ORDER_ID, { force: true });
  console.log('ticket_purchase email queued/sent');

  const deliveries = await prisma.emailDelivery.findMany({
    where: { orderId: PAID_ORDER_ID, template: 'ticket_purchase' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      status: true,
      to: true,
      errorMessage: true,
      messageId: true,
      sentAt: true
    }
  });
  console.log('deliveries', JSON.stringify(deliveries, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
