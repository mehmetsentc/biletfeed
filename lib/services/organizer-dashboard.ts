import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { buildUpcomingFilter } from '@/lib/services/events';
import {
  matchesSalesCategory,
  type SalesCategoryFilter
} from '@/lib/services/ticket-type-category';

export async function getOrganizerStats(organizerId: string) {
  await ensureDbConnection();
  const [eventCount, orders, tickets] = await Promise.all([
    prisma.event.count({
      where: { organizerId, ...buildUpcomingFilter() }
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

export async function getOrganizerOrders(
  organizerId: string,
  category: SalesCategoryFilter = 'all'
) {
  await ensureDbConnection();
  const orders = await prisma.order.findMany({
    where: {
      organizerId,
      deletedAt: null,
      paymentProvider: { not: 'invitation' },
      ...(category === 'all' ? {} : { status: 'paid' as const })
    },
    include: {
      event: { select: { title: true, slug: true } },
      user: { select: { displayName: true, email: true } },
      items: {
        include: { ticketType: { select: { name: true, type: true } } }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  if (category === 'all') return orders;

  return orders.filter((order) =>
    order.items.some((item) =>
      matchesSalesCategory(item.ticketType.type, item.ticketType.name, category)
    )
  );
}

export async function getOrganizerTickets(
  organizerId: string,
  category: SalesCategoryFilter = 'all'
) {
  await ensureDbConnection();
  const tickets = await prisma.purchasedTicket.findMany({
    where: {
      event: { organizerId },
      deletedAt: null,
      order: { paymentProvider: { not: 'invitation' } }
    },
    include: {
      event: { select: { title: true } },
      ticketType: { select: { name: true, type: true } },
      user: { select: { displayName: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 200
  });

  if (category === 'all') return tickets;

  return tickets.filter((t) =>
    matchesSalesCategory(t.ticketType.type, t.ticketType.name, category)
  );
}
