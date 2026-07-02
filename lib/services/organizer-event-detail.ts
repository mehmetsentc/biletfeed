import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export async function getOrganizerEventDetail(
  organizerId: string,
  eventId: string
) {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    include: {
      city: true,
      venue: true,
      category: true,
      organizer: { select: { name: true, slug: true } },
      ticketTypes: {
        where: { deletedAt: null },
        orderBy: { price: 'asc' }
      }
    }
  });

  if (!event) return null;

  const [
    paidOrders,
    revenueAgg,
    orderCount,
    recentTickets,
    checkedIn,
    invitationCount
  ] = await Promise.all([
    prisma.order.findMany({
      where: { eventId, status: 'paid', deletedAt: null },
      orderBy: { paidAt: 'desc' },
      take: 8,
      include: {
        user: { select: { displayName: true, email: true } },
        items: {
          include: { ticketType: { select: { name: true } } }
        }
      }
    }),
    prisma.order.aggregate({
      where: { eventId, status: 'paid', deletedAt: null },
      _sum: { total: true, subtotal: true, commission: true }
    }),
    prisma.order.count({
      where: { eventId, status: 'paid', deletedAt: null }
    }),
    prisma.purchasedTicket.findMany({
      where: { eventId, deletedAt: null, status: { in: ['VALID', 'USED'] } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        ticketType: { select: { name: true } },
        user: { select: { displayName: true } }
      }
    }),
    prisma.purchasedTicket.count({
      where: {
        eventId,
        deletedAt: null,
        entryCount: { gt: 0 }
      }
    }),
    prisma.eventInvitation.count({
      where: { eventId, deletedAt: null }
    })
  ]);

  const ticketCapacity = event.ticketTypes.reduce(
    (sum, t) => sum + (t.capacity || t.quantity),
    0
  );
  const ticketSold = event.ticketTypes.reduce((sum, t) => sum + t.sold, 0);
  const occupancyPct =
    ticketCapacity > 0
      ? Math.min(100, Math.round((ticketSold / ticketCapacity) * 100))
      : 0;

  const categories = event.ticketTypes.map((tt) => {
    const cap = tt.capacity || tt.quantity;
    const pct = cap > 0 ? Math.min(100, Math.round((tt.sold / cap) * 100)) : 0;
    return {
      id: tt.id,
      name: tt.name,
      price: tt.price,
      sold: tt.sold,
      capacity: cap,
      occupancyPct: pct,
      status: tt.status,
      saleStartDate: tt.saleStartDate,
      saleEndDate: tt.saleEndDate,
      showLowStockBadge: tt.showLowStockBadge
    };
  });

  const revenue = revenueAgg._sum.total ?? 0;
  const commission = revenueAgg._sum.commission ?? 0;
  const netOrganizer = Math.max(0, revenue - commission);

  return {
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      shortDescription: event.shortDescription,
      coverImage: event.coverImage,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      isFree: event.isFree,
      capacity: event.capacity,
      city: event.city.name,
      venue: event.venue?.name ?? null,
      venueAddress: event.venue?.address ?? null,
      category: event.category.name,
      displayId: event.id.replace(/-/g, '').slice(0, 5).toUpperCase(),
      organizerName: event.organizer.name,
      organizerSlug: event.organizer.slug
    },
    stats: {
      ticketSold,
      ticketCapacity,
      occupancyPct,
      emptyPct: ticketCapacity > 0 ? 100 - occupancyPct : 100,
      revenue,
      subtotal: revenueAgg._sum.subtotal ?? 0,
      commission,
      netOrganizer,
      orderCount,
      checkedIn,
      invitationCount,
      waitingEntry: Math.max(0, ticketSold - checkedIn)
    },
    categories,
    recentOrders: paidOrders.map((o) => ({
      id: o.id,
      total: o.total,
      paidAt: o.paidAt ?? o.createdAt,
      buyerName: o.attendeeName || o.user.displayName || o.user.email,
      items: o.items.map((i) => ({
        name: i.ticketType.name,
        quantity: i.quantity
      }))
    })),
    recentTickets: recentTickets.map((t) => ({
      id: t.id,
      code: t.ticketCode,
      holderName: t.attendeeName || t.user.displayName,
      ticketType: t.ticketType.name,
      createdAt: t.createdAt,
      status: t.status
    }))
  };
}
