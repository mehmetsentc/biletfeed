import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { buildUpcomingFilter } from '@/lib/services/events';
import {
  matchesSalesCategory,
  type SalesCategoryFilter
} from '@/lib/services/ticket-type-category';
import type { OrganizerTicketsFilter } from '@/lib/services/organizer-ticket-filters';

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

export async function getOrganizerEventOptions(organizerId: string) {
  await ensureDbConnection();
  const events = await prisma.event.findMany({
    where: { organizerId, deletedAt: null },
    select: { id: true, title: true, startDate: true },
    orderBy: { startDate: 'desc' },
    take: 100
  });
  return events;
}

export async function getOrganizerEventSummary(
  organizerId: string,
  eventId?: string
) {
  await ensureDbConnection();
  const eventFilter = eventId ? { eventId } : { event: { organizerId } };

  const [
    paidTickets,
    invitationTickets,
    checkedIn,
    paidNotEntered,
    invitedNotEntered
  ] = await Promise.all([
    // Satın alınan biletler (davetiye hariç)
    prisma.purchasedTicket.count({
      where: {
        ...eventFilter,
        deletedAt: null,
        status: { in: ['VALID', 'USED'] },
        order: { paymentProvider: { not: 'invitation' } }
      }
    }),
    // Davetiye biletleri
    prisma.purchasedTicket.count({
      where: {
        ...eventFilter,
        deletedAt: null,
        status: { in: ['VALID', 'USED'] },
        order: { paymentProvider: 'invitation' }
      }
    }),
    // Giriş yapılanlar (tüm biletler)
    prisma.purchasedTicket.count({
      where: {
        ...eventFilter,
        deletedAt: null,
        status: { in: ['VALID', 'USED'] },
        entryCount: { gt: 0 }
      }
    }),
    // Satın alınıp giriş yapılmayanlar
    prisma.purchasedTicket.count({
      where: {
        ...eventFilter,
        deletedAt: null,
        status: { in: ['VALID', 'USED'] },
        entryCount: 0,
        order: { paymentProvider: { not: 'invitation' } }
      }
    }),
    // Davetiye gönderilip giriş yapılmayanlar
    prisma.purchasedTicket.count({
      where: {
        ...eventFilter,
        deletedAt: null,
        status: { in: ['VALID', 'USED'] },
        entryCount: 0,
        order: { paymentProvider: 'invitation' }
      }
    })
  ]);

  return { paidTickets, invitationTickets, checkedIn, paidNotEntered, invitedNotEntered };
}

export async function getOrganizerOrders(
  organizerId: string,
  category: SalesCategoryFilter = 'all',
  eventId?: string
) {
  await ensureDbConnection();
  const orders = await prisma.order.findMany({
    where: {
      organizerId,
      deletedAt: null,
      paymentProvider: { not: 'invitation' },
      ...(category === 'all' ? {} : { status: 'paid' as const }),
      ...(eventId ? { eventId } : {})
    },
    include: {
      event: { select: { title: true, slug: true } },
      user: { select: { displayName: true, email: true } },
      items: {
        include: { ticketType: { select: { name: true, type: true } } }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 200
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
  filter: OrganizerTicketsFilter | SalesCategoryFilter = { kind: 'all' },
  eventId?: string
) {
  await ensureDbConnection();

  const where: {
    event: { organizerId: string; id?: string };
    deletedAt: null;
    ticketTypeId?: { in: string[] };
    order?: { paymentProvider: 'invitation' | { not: 'invitation' } };
  } = {
    event: {
      organizerId,
      ...(eventId ? { id: eventId } : {})
    },
    deletedAt: null
  };

  if (typeof filter === 'string') {
    if (filter !== 'all') {
      where.order = { paymentProvider: { not: 'invitation' } };
    }
  } else if (filter.kind === 'invitation') {
    where.order = { paymentProvider: 'invitation' };
  } else if (filter.kind === 'ticketTypes') {
    where.ticketTypeId = { in: filter.ticketTypeIds };
  }

  const tickets = await prisma.purchasedTicket.findMany({
    where,
    include: {
      event: { select: { id: true, title: true } },
      ticketType: { select: { name: true, type: true } },
      user: { select: { displayName: true } },
      order: { select: { paymentProvider: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 200
  });

  if (typeof filter === 'string') {
    if (filter === 'all') return tickets;
    return tickets.filter((t) =>
      matchesSalesCategory(t.ticketType.type, t.ticketType.name, filter)
    );
  }

  return tickets;
}
