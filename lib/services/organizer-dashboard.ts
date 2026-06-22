import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { upcomingFilter } from '@/lib/services/events';

export async function getOrganizerStats(organizerId: string) {
  await ensureDbConnection();
  const [eventCount, orders, tickets] = await Promise.all([
    prisma.event.count({
      where: { organizerId, ...upcomingFilter }
    }),
    prisma.order.findMany({
      where: { organizerId, status: 'paid', deletedAt: null },
      select: { total: true, items: { select: { quantity: true } } }
    }),
    prisma.purchasedTicket.count({
      where: {
        event: { organizerId },
        deletedAt: null,
        status: { in: ['VALID', 'USED'] }
      }
    })
  ]);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const soldTickets = orders.reduce(
    (s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0),
    0
  );

  return {
    eventCount,
    soldTickets: soldTickets || tickets,
    revenue,
    scannedTickets: await prisma.purchasedTicket.count({
      where: { event: { organizerId }, status: 'USED', deletedAt: null }
    })
  };
}

export async function getOrganizerEvents(organizerId: string) {
  await ensureDbConnection();
  return prisma.event.findMany({
    where: { organizerId, deletedAt: null },
    include: {
      city: true,
      _count: { select: { purchasedTickets: true, orders: true } }
    },
    orderBy: { startDate: 'desc' },
    take: 50
  });
}

export async function getOrganizerOrders(organizerId: string) {
  await ensureDbConnection();
  return prisma.order.findMany({
    where: { organizerId, deletedAt: null },
    include: {
      event: { select: { title: true, slug: true } },
      user: { select: { displayName: true, email: true } },
      items: { include: { ticketType: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

export async function getOrganizerTickets(organizerId: string) {
  await ensureDbConnection();
  return prisma.purchasedTicket.findMany({
    where: { event: { organizerId }, deletedAt: null },
    include: {
      event: { select: { title: true } },
      ticketType: { select: { name: true } },
      user: { select: { displayName: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 200
  });
}
