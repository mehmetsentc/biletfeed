import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import {
  generateTicketCode,
  generateValidationToken,
  newTicketId
} from '@/lib/tickets/sign';
import { processPayment } from '@/lib/payments/process';

export async function checkoutEvent(params: {
  firebaseUid: string;
  eventSlug: string;
  quantity: number;
}) {
  await ensureDbConnection();

  const user = await prisma.user.findFirst({
    where: { firebaseUid: params.firebaseUid, deletedAt: null }
  });
  if (!user) throw new Error('Kullanıcı bulunamadı');

  const event = await prisma.event.findFirst({
    where: { slug: params.eventSlug, status: 'published', deletedAt: null },
    include: {
      ticketTypes: {
        where: { status: 'active', deletedAt: null },
        orderBy: { price: 'asc' },
        take: 1
      }
    }
  });
  if (!event) throw new Error('Etkinlik bulunamadı');

  if (event.listingType === 'external') {
    throw new Error(
      'Bu etkinlik harici bir platformdadır. Bilet için kaynak siteye yönlendirilmelisiniz.'
    );
  }

  const ticketType = event.ticketTypes[0];
  if (!ticketType) throw new Error('Aktif bilet türü bulunamadı');

  const qty = Math.min(Math.max(params.quantity, 1), 10);
  if (ticketType.sold + qty > ticketType.capacity) {
    throw new Error('Yeterli bilet kalmadı');
  }

  const subtotal = ticketType.price * qty;
  const payment = await processPayment({ amount: subtotal });
  if (!payment.success) throw new Error('Ödeme başarısız');

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId: user.id,
        eventId: event.id,
        organizerId: event.organizerId,
        subtotal,
        total: subtotal,
        status: 'paid',
        paymentProvider: payment.provider,
        paymentId: payment.paymentId,
        items: {
          create: {
            ticketTypeId: ticketType.id,
            quantity: qty,
            unitPrice: ticketType.price
          }
        }
      }
    });

    await tx.transaction.create({
      data: {
        orderId: order.id,
        organizerId: event.organizerId,
        amount: subtotal,
        status: 'completed',
        provider: payment.provider,
        providerRef: payment.paymentId
      }
    });

    for (let i = 0; i < qty; i++) {
      const ticketId = newTicketId();
      await tx.purchasedTicket.create({
        data: {
          id: ticketId,
          orderId: order.id,
          ticketTypeId: ticketType.id,
          userId: user.id,
          eventId: event.id,
          ticketCode: generateTicketCode(),
          validationToken: generateValidationToken(ticketId, event.id),
          status: 'VALID'
        }
      });
    }

    await tx.ticketType.update({
      where: { id: ticketType.id },
      data: { sold: { increment: qty } }
    });

    return { orderId: order.id, ticketCount: qty };
  });
}
