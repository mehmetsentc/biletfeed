import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: {
      deletedAt: null,
      OR: [
        { attendeeName: { contains: 'Deniz', mode: 'insensitive' } },
        { user: { displayName: { contains: 'Deniz', mode: 'insensitive' } } },
        { attendeeName: { contains: 'Hizmet', mode: 'insensitive' } }
      ],
      event: {
        OR: [
          { slug: { contains: 'blok3', mode: 'insensitive' } },
          { title: { contains: 'BLOK3', mode: 'insensitive' } }
        ]
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      status: true,
      total: true,
      paymentProvider: true,
      attendeeName: true,
      attendeeEmail: true,
      paidAt: true,
      createdAt: true,
      userId: true,
      user: { select: { id: true, email: true, displayName: true, firebaseUid: true } },
      event: { select: { title: true, slug: true } },
      items: {
        select: { quantity: true, ticketType: { select: { name: true } } }
      },
      purchasedTickets: {
        select: {
          id: true,
          ticketCode: true,
          status: true,
          deletedAt: true,
          userId: true,
          attendeeEmail: true,
          attendeeName: true,
          createdAt: true
        }
      }
    }
  });

  const orderIds = orders.map((o) => o.id);
  const emails =
    orderIds.length === 0
      ? []
      : await prisma.emailDelivery.findMany({
          where: { orderId: { in: orderIds } },
          select: {
            id: true,
            orderId: true,
            template: true,
            status: true,
            to: true,
            errorMessage: true,
            sentAt: true,
            createdAt: true,
            messageId: true,
            metadata: true
          },
          orderBy: { createdAt: 'desc' }
        });

  console.log(
    JSON.stringify(
      {
        orders: orders.map((o) => ({
          ...o,
          emails: emails.filter((e) => e.orderId === o.id)
        }))
      },
      null,
      2
    )
  );

  // Fallback: last paid BLOK3 non-invite
  const recent = await prisma.order.findMany({
    where: {
      deletedAt: null,
      status: 'paid',
      total: { gt: 0 },
      paymentProvider: { not: 'invitation' },
      event: {
        OR: [
          { slug: { contains: 'blok3', mode: 'insensitive' } },
          { title: { contains: 'BLOK3', mode: 'insensitive' } }
        ]
      }
    },
    orderBy: { paidAt: 'desc' },
    take: 6,
    select: {
      id: true,
      total: true,
      attendeeName: true,
      attendeeEmail: true,
      paidAt: true,
      userId: true,
      user: { select: { email: true, displayName: true, firebaseUid: true } },
      purchasedTickets: {
        select: { id: true, status: true, deletedAt: true, userId: true, ticketCode: true }
      }
    }
  });
  console.log('\n--- recent paid BLOK3 ---\n');
  console.log(JSON.stringify(recent, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
