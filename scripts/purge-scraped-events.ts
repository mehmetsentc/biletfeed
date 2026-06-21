/**
 * Tüm harici (scraper) etkinlikleri siler — sıfırdan scrape için.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteEventsByIds(ids: string[]) {
  if (ids.length === 0) return 0;

  const ticketTypes = await prisma.ticketType.findMany({
    where: { eventId: { in: ids } },
    select: { id: true }
  });
  const ticketTypeIds = ticketTypes.map((t) => t.id);

  if (ticketTypeIds.length > 0) {
    await prisma.orderItem.deleteMany({
      where: { ticketTypeId: { in: ticketTypeIds } }
    });
    await prisma.purchasedTicket.deleteMany({
      where: { ticketTypeId: { in: ticketTypeIds } }
    });
    await prisma.ticketType.deleteMany({ where: { id: { in: ticketTypeIds } } });
  }

  await prisma.favorite.deleteMany({ where: { eventId: { in: ids } } });
  await prisma.review.deleteMany({ where: { eventId: { in: ids } } });

  const result = await prisma.event.deleteMany({ where: { id: { in: ids } } });
  return result.count;
}

async function main() {
  const external = await prisma.event.findMany({
    where: {
      deletedAt: null,
      listingType: 'external'
    },
    select: { id: true, slug: true, title: true, externalPlatform: true }
  });

  console.log(`${external.length} harici etkinlik silinecek…`);

  const deleted = await deleteEventsByIds(external.map((e) => e.id));
  console.log(`✓ ${deleted} etkinlik silindi.`);

  const remaining = await prisma.event.count({
    where: { deletedAt: null, status: 'published' }
  });
  console.log(`Kalan yayınlanmış etkinlik: ${remaining}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
