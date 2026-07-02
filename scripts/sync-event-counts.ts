/**
 * Şehir/kategori eventCount önbelleğini internal etkinliklere göre yeniler.
 *
 * Kullanım: npm run events:sync-counts
 */
import { syncCityAndCategoryEventCounts } from '@/lib/services/event-counts';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

async function main() {
  await ensureDbConnection();
  await syncCityAndCategoryEventCounts();

  const topCities = await prisma.city.findMany({
    where: { deletedAt: null, eventCount: { gt: 0 } },
    orderBy: { eventCount: 'desc' },
    take: 10,
    select: { name: true, eventCount: true }
  });

  console.log('Şehir ve kategori sayıları güncellendi.');
  console.log('Örnek şehirler:', topCities);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
