import type { Prisma } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { eventInclude, toMockEvent } from '@/lib/mappers/event';
import { upcomingStartFilter } from '@/lib/events/upcoming';

export type AdminEventEditorFilters = {
  kategori?: string;
  sehir?: string;
  /** startDate >= tarih */
  tarih?: string;
  /** Başlık / açıklama araması */
  q?: string;
  /** true → yalnızca gelecek; false → geçmiş dahil */
  upcomingOnly?: boolean;
};

/** BiletFeed organizatör etkinlikleri — onaylı (published), scraper hariç */
export async function listAdminEditorEvents(filters: AdminEventEditorFilters = {}) {
  await ensureDbConnection();

  const now = new Date();
  const q = filters.q?.trim();

  const where: Prisma.EventWhereInput = {
    deletedAt: null,
    listingType: 'internal',
    status: { in: ['published', 'cancelled'] },
    ...(filters.upcomingOnly !== false ? upcomingStartFilter(now) : {}),
    ...(filters.kategori ? { category: { slug: filters.kategori } } : {}),
    ...(filters.sehir ? { city: { slug: filters.sehir } } : {}),
    ...(filters.tarih ? { startDate: { gte: new Date(filters.tarih) } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { organizer: { name: { contains: q, mode: 'insensitive' } } }
          ]
        }
      : {})
  };

  const [events, allCities] = await Promise.all([
    prisma.event.findMany({
      where,
      include: eventInclude,
      orderBy: [{ startDate: 'desc' }],
      take: 500
    }),
    prisma.city.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: { slug: true, name: true }
    })
  ]);

  return {
    rows: events.map(toMockEvent),
    cities: allCities
  };
}

export function adminEventEditorHasActiveFilter(filters: {
  kategori?: string;
  sehir?: string;
  tarih?: string;
  q?: string;
}): boolean {
  return Boolean(
    filters.kategori?.trim() ||
      filters.sehir?.trim() ||
      filters.tarih?.trim() ||
      filters.q?.trim()
  );
}
