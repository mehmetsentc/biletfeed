import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const email = 'hizmetcideniz182@gmail.com';

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
    select: {
      id: true,
      email: true,
      displayName: true,
      firebaseUid: true,
      createdAt: true,
      _count: { select: { purchasedTickets: true, orders: true } }
    }
  });
  console.log('users', JSON.stringify(users, null, 2));

  const deliveries = await prisma.emailDelivery.findMany({
    where: {
      OR: [
        { to: { equals: email, mode: 'insensitive' } },
        {
          orderId: {
            in: [
              '33a6a8bf-1c37-40e3-8892-43da41224558',
              'aa16bec0-dde1-4abc-8359-05597afd0a0c'
            ]
          }
        }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      template: true,
      status: true,
      to: true,
      orderId: true,
      errorMessage: true,
      sentAt: true,
      createdAt: true,
      messageId: true
    }
  });
  console.log('emails', JSON.stringify(deliveries, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
