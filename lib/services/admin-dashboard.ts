import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { upcomingFilter } from '@/lib/services/events';

export async function getAdminStats() {
  await ensureDbConnection();
  try {
    const [users, organizers, activeEvents, orders] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.organizer.count({ where: { deletedAt: null, status: 'approved' } }),
      prisma.event.count({ where: upcomingFilter }),
      prisma.order.findMany({
        where: { status: 'paid', deletedAt: null },
        select: { total: true }
      })
    ]);

    const revenue = orders.reduce((s, o) => s + o.total, 0);
    return { users, organizers, activeEvents, revenue, orderCount: orders.length };
  } catch (error) {
    console.error('[admin] getAdminStats failed:', error);
    return {
      users: 0,
      organizers: 0,
      activeEvents: 0,
      revenue: 0,
      orderCount: 0
    };
  }
}

export async function getAdminUsers(limit = 100) {
  await ensureDbConnection();
  return prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      createdAt: true,
      ownedOrganizer: { select: { name: true, slug: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

export async function getAdminOrders(limit = 100) {
  await ensureDbConnection();
  try {
    return await prisma.order.findMany({
      where: { deletedAt: null },
      include: {
        event: { select: { title: true } },
        user: { select: { displayName: true, email: true } },
        organizer: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  } catch (error) {
    console.error('[admin] getAdminOrders failed:', error);
    return [];
  }
}

// ─── Organizatörler ────────────────────────────────────────────────────────────

export async function getAdminOrganizers() {
  await ensureDbConnection();
  return prisma.organizer.findMany({
    where: { deletedAt: null },
    include: {
      owner: { select: { email: true, displayName: true } },
      _count: { select: { events: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateOrganizerStatus(
  id: string,
  status: 'approved' | 'pending' | 'suspended'
) {
  await ensureDbConnection();
  return prisma.organizer.update({ where: { id }, data: { status } });
}

export async function updateOrganizerCommission(id: string, rate: number) {
  await ensureDbConnection();
  return prisma.organizer.update({ where: { id }, data: { commissionRate: rate } });
}

// ─── Kategoriler ───────────────────────────────────────────────────────────────

export async function getAdminCategories() {
  await ensureDbConnection();
  return prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { eventCount: 'desc' }
  });
}

export async function upsertCategory(data: {
  slug: string;
  name: string;
  image?: string;
  description?: string;
}) {
  await ensureDbConnection();
  return prisma.category.upsert({
    where: { slug: data.slug },
    update: { name: data.name, image: data.image, description: data.description },
    create: { slug: data.slug, name: data.name, image: data.image, description: data.description }
  });
}

// ─── Şehirler ──────────────────────────────────────────────────────────────────

export async function getAdminCities() {
  await ensureDbConnection();
  return prisma.city.findMany({
    where: { deletedAt: null },
    orderBy: { eventCount: 'desc' }
  });
}

export async function upsertCity(data: {
  slug: string;
  name: string;
  image?: string;
}) {
  await ensureDbConnection();
  return prisma.city.upsert({
    where: { slug: data.slug },
    update: { name: data.name, image: data.image },
    create: { slug: data.slug, name: data.name, image: data.image }
  });
}

// ─── Mekanlar ──────────────────────────────────────────────────────────────────

export async function getAdminVenues() {
  await ensureDbConnection();
  return prisma.venue.findMany({
    where: { deletedAt: null },
    include: {
      city: { select: { name: true } },
      organizer: { select: { name: true } }
    },
    orderBy: { eventCount: 'desc' },
    take: 200
  });
}

// ─── Analitik ──────────────────────────────────────────────────────────────────

export async function getAdminAnalytics() {
  await ensureDbConnection();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers30d,
    totalEvents,
    activeEvents,
    totalOrders,
    paidOrders,
    revenueAll,
    revenue30d,
    totalTickets,
    categoryStats,
    cityStats
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.event.count({ where: { deletedAt: null } }),
    prisma.event.count({ where: { deletedAt: null, status: 'published', startDate: { gte: new Date() } } }),
    prisma.order.count({ where: { deletedAt: null } }),
    prisma.order.count({ where: { deletedAt: null, status: 'paid' } }),
    prisma.order.aggregate({ where: { deletedAt: null, status: 'paid' }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { deletedAt: null, status: 'paid', paidAt: { gte: thirtyDaysAgo } }, _sum: { total: true } }),
    prisma.purchasedTicket.count({ where: { deletedAt: null } }),
    prisma.category.findMany({
      where: { deletedAt: null, eventCount: { gt: 0 } },
      select: { name: true, slug: true, eventCount: true },
      orderBy: { eventCount: 'desc' },
      take: 8
    }),
    prisma.city.findMany({
      where: { deletedAt: null, eventCount: { gt: 0 } },
      select: { name: true, slug: true, eventCount: true },
      orderBy: { eventCount: 'desc' },
      take: 10
    })
  ]);

  // Prev 30d revenue for growth calc
  const prevRevenue = await prisma.order.aggregate({
    where: { deletedAt: null, status: 'paid', paidAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    _sum: { total: true }
  });

  const rev30 = revenue30d._sum.total ?? 0;
  const revPrev = prevRevenue._sum.total ?? 0;
  const revenueGrowth = revPrev > 0 ? Math.round(((rev30 - revPrev) / revPrev) * 100) : null;

  return {
    totalUsers,
    newUsers30d,
    totalEvents,
    activeEvents,
    totalOrders,
    paidOrders,
    revenueAll: revenueAll._sum.total ?? 0,
    revenue30d: rev30,
    revenueGrowth,
    totalTickets,
    conversionRate: totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100) : 0,
    categoryStats,
    cityStats
  };
}
