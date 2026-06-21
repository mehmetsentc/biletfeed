#!/usr/bin/env tsx
import { prisma, isDatabaseConfigured } from '../lib/db/prisma';
import { getAllEvents } from '../lib/services/events';

async function main() {
  console.log('DB configured:', isDatabaseConfigured());
  const total = await prisma.event.count({
    where: { status: 'published', deletedAt: null }
  });
  const upcoming = await prisma.event.count({
    where: {
      status: 'published',
      deletedAt: null,
      startDate: { gte: new Date() }
    }
  });
  const external = await prisma.event.count({
    where: { listingType: 'external', deletedAt: null, status: 'published' }
  });
  const byPlatform = await prisma.event.groupBy({
    by: ['externalPlatform'],
    where: { listingType: 'external', deletedAt: null },
    _count: true
  });
  const sample = await prisma.event.findMany({
    where: { status: 'published', deletedAt: null, startDate: { gte: new Date() } },
    take: 5,
    orderBy: { startDate: 'asc' },
    select: { title: true, slug: true, externalPlatform: true, startDate: true }
  });
  const serviceEvents = await getAllEvents();

  console.log(JSON.stringify({ total, upcoming, external, byPlatform, sample, serviceCount: serviceEvents.length }, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
