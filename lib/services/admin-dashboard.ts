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
