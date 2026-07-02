import type { ExternalPlatform, Prisma } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export type PurgeScrapedEventsResult = {
  deleted: number;
  breakdown: Record<string, number>;
  feedPostsUnlinked: number;
  ordersRemoved: number;
};

async function deleteEventsByIds(
  tx: Prisma.TransactionClient,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;

  await tx.feedPost.updateMany({
    where: { eventId: { in: ids } },
    data: { eventId: null }
  });

  const orders = await tx.order.findMany({
    where: { eventId: { in: ids } },
    select: { id: true }
  });
  const orderIds = orders.map((order) => order.id);

  if (orderIds.length > 0) {
    const invoices = await tx.invoice.findMany({
      where: { orderId: { in: orderIds } },
      select: { id: true }
    });
    const invoiceIds = invoices.map((invoice) => invoice.id);

    if (invoiceIds.length > 0) {
      await tx.invoiceLine.deleteMany({
        where: { invoiceId: { in: invoiceIds } }
      });
      await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
    }

    await tx.revenueRecognition.deleteMany({
      where: { orderId: { in: orderIds } }
    });
    await tx.paymentReconciliation.deleteMany({
      where: { orderId: { in: orderIds } }
    });
    await tx.organizerPayout.deleteMany({
      where: { orderId: { in: orderIds } }
    });
    await tx.transaction.deleteMany({
      where: { orderId: { in: orderIds } }
    });
    await tx.purchasedTicket.deleteMany({
      where: { orderId: { in: orderIds } }
    });
    await tx.order.deleteMany({ where: { id: { in: orderIds } } });
  }

  const ticketTypes = await tx.ticketType.findMany({
    where: { eventId: { in: ids } },
    select: { id: true }
  });
  const ticketTypeIds = ticketTypes.map((ticketType) => ticketType.id);

  if (ticketTypeIds.length > 0) {
    await tx.eventInvitation.deleteMany({
      where: { ticketTypeId: { in: ticketTypeIds } }
    });
    await tx.purchasedTicket.deleteMany({
      where: { ticketTypeId: { in: ticketTypeIds } }
    });
    await tx.orderItem.deleteMany({
      where: { ticketTypeId: { in: ticketTypeIds } }
    });
    await tx.ticketType.deleteMany({ where: { id: { in: ticketTypeIds } } });
  }

  await tx.review.deleteMany({ where: { eventId: { in: ids } } });
  await tx.favorite.deleteMany({ where: { eventId: { in: ids } } });
  await tx.coupon.deleteMany({ where: { eventId: { in: ids } } });
  await tx.event.deleteMany({ where: { id: { in: ids } } });
}

/** Tüm harici (scraper) etkinlikleri kalıcı olarak siler; internal etkinliklere dokunmaz. */
export async function purgeScrapedEvents(): Promise<PurgeScrapedEventsResult> {
  await ensureDbConnection();

  const events = await prisma.event.findMany({
    where: { listingType: 'external' },
    select: { id: true, externalPlatform: true }
  });

  if (events.length === 0) {
    return { deleted: 0, breakdown: {}, feedPostsUnlinked: 0, ordersRemoved: 0 };
  }

  const ids = events.map((event) => event.id);
  const breakdown = events.reduce<Record<string, number>>((acc, event) => {
    const key = event.externalPlatform ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const [feedPostsUnlinked, ordersRemoved] = await Promise.all([
    prisma.feedPost.count({ where: { eventId: { in: ids } } }),
    prisma.order.count({ where: { eventId: { in: ids } } })
  ]);

  await prisma.$transaction(async (tx) => {
    await deleteEventsByIds(tx, ids);
  });

  return {
    deleted: ids.length,
    breakdown,
    feedPostsUnlinked,
    ordersRemoved
  };
}

export type ScrapedEventsSummary = {
  external: number;
  internal: number;
  publishedInternal: number;
  breakdown: Record<string, number>;
};

export async function getScrapedEventsSummary(): Promise<ScrapedEventsSummary> {
  await ensureDbConnection();

  const [external, internal, publishedInternal, platformCounts] = await Promise.all([
    prisma.event.count({ where: { listingType: 'external' } }),
    prisma.event.count({ where: { listingType: 'internal', deletedAt: null } }),
    prisma.event.count({
      where: { listingType: 'internal', status: 'published', deletedAt: null }
    }),
    prisma.event.groupBy({
      by: ['externalPlatform'],
      where: { listingType: 'external' },
      _count: { id: true }
    })
  ]);

  const breakdown = Object.fromEntries(
    platformCounts.map((row) => [
      (row.externalPlatform as ExternalPlatform | null) ?? 'unknown',
      row._count.id
    ])
  );

  return { external, internal, publishedInternal, breakdown };
}
