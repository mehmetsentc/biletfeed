/**
 * Seed / demo etkinliklerini siler; scraper kaynaklı (external) etkinlikler kalır.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mockEvents = await prisma.event.findMany({
    where: {
      deletedAt: null,
      listingType: { not: 'external' },
      NOT: { slug: { startsWith: 'ext-' } }
    },
    select: { id: true, slug: true, title: true, listingType: true }
  });

  if (mockEvents.length === 0) {
    console.log('Silinecek örnek etkinlik bulunamadı.');
    return;
  }

  console.log(`${mockEvents.length} örnek etkinlik silinecek:`);
  for (const e of mockEvents.slice(0, 10)) {
    console.log(`  - ${e.slug} (${e.title})`);
  }
  if (mockEvents.length > 10) {
    console.log(`  ... ve ${mockEvents.length - 10} tane daha`);
  }

  const ids = mockEvents.map((e) => e.id);
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
  console.log(`\n✓ ${result.count} etkinlik silindi.`);

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
