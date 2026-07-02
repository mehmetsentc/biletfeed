import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { internalPublicFilter } from '@/lib/services/events';

/** City/Category tablolarındaki eventCount önbelleğini gerçek internal etkinlik sayısıyla eşitle */
export async function syncCityAndCategoryEventCounts(): Promise<void> {
  await ensureDbConnection();

  const [cityCounts, categoryCounts] = await Promise.all([
    prisma.event.groupBy({
      by: ['cityId'],
      where: internalPublicFilter,
      _count: { id: true }
    }),
    prisma.event.groupBy({
      by: ['categoryId'],
      where: internalPublicFilter,
      _count: { id: true }
    })
  ]);

  const cityMap = new Map(cityCounts.map((row) => [row.cityId, row._count.id]));
  const categoryMap = new Map(
    categoryCounts.map((row) => [row.categoryId, row._count.id])
  );

  const [cities, categories] = await Promise.all([
    prisma.city.findMany({ where: { deletedAt: null }, select: { id: true } }),
    prisma.category.findMany({ where: { deletedAt: null }, select: { id: true } })
  ]);

  await prisma.$transaction([
    ...cities.map((city) =>
      prisma.city.update({
        where: { id: city.id },
        data: { eventCount: cityMap.get(city.id) ?? 0 }
      })
    ),
    ...categories.map((category) =>
      prisma.category.update({
        where: { id: category.id },
        data: { eventCount: categoryMap.get(category.id) ?? 0 }
      })
    )
  ]);
}
