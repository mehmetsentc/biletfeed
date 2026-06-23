import { prisma, isDatabaseConfigured, ensureDbConnection } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';
import {
  categories as mockCategories,
  cities as mockCities,
  type MockEvent
} from '@/lib/data/mock-events';
import { resolveCategoryImage } from '@/lib/data/category-images';
import { eventInclude, toMockEvent } from '@/lib/mappers/event';
import { mapCategory } from '@/lib/scraper/normalize';

/** Başlık açıkça başka kategoriye işaret ediyorsa yanlış DB kaydını filtrele */
function eventMatchesCategorySlug(
  event: { title: string; description: string; categorySlug: string },
  categorySlug: string
): boolean {
  const fromTitle = mapCategory(event.title, '');
  if (fromTitle.categorySlug !== 'muzik') {
    return fromTitle.categorySlug === categorySlug;
  }
  return event.categorySlug === categorySlug;
}

export const publishedFilter = {
  status: 'published' as const,
  deletedAt: null
};

export function upcomingStartFilter(now = new Date()) {
  return { startDate: { gte: now } };
}

export const upcomingFilter = {
  ...publishedFilter,
  ...upcomingStartFilter()
};

async function fetchPublishedEvents(
  where?: Prisma.EventWhereInput,
  options?: { upcomingOnly?: boolean }
) {
  if (!isDatabaseConfigured()) return [];
  await ensureDbConnection();
  const baseWhere = options?.upcomingOnly !== false ? upcomingFilter : publishedFilter;
  const events = await prisma.event.findMany({
    where: { ...baseWhere, ...where },
    include: eventInclude,
    orderBy: { startDate: 'asc' }
  });
  return events.map(toMockEvent);
}

export async function getAllEvents(): Promise<MockEvent[]> {
  return fetchPublishedEvents();
}

export async function getEventBySlug(
  slug: string
): Promise<MockEvent | undefined> {
  if (!isDatabaseConfigured()) return undefined;
  await ensureDbConnection();
  const event = await prisma.event.findFirst({
    where: { slug, ...upcomingFilter },
    include: eventInclude
  });
  return event ? toMockEvent(event) : undefined;
}

async function fetchUpcomingExternal(limit = 12): Promise<MockEvent[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureDbConnection();
  const events = await prisma.event.findMany({
    where: {
      ...upcomingFilter,
      listingType: 'external'
    },
    include: eventInclude,
    orderBy: [{ lastScrapedAt: 'desc' }, { startDate: 'asc' }],
    take: limit
  });
  return events.map(toMockEvent);
}

export async function getFeaturedEvents(): Promise<MockEvent[]> {
  const featured = await fetchPublishedEvents({ isFeatured: true });
  if (featured.length >= 3) return featured;
  return fetchUpcomingExternal(12);
}

export async function getTrendingEvents(): Promise<MockEvent[]> {
  const trending = await fetchPublishedEvents({ isTrending: true });
  if (trending.length >= 3) return trending;
  return fetchUpcomingExternal(12);
}

export async function getDiscountedEvents(): Promise<MockEvent[]> {
  return fetchPublishedEvents({ discountPercent: { gt: 0 } });
}

export async function getOnlineEvents(): Promise<MockEvent[]> {
  return fetchPublishedEvents({
    OR: [{ isOnline: true }, { category: { slug: 'online' } }]
  });
}

export async function getEventsByCategory(
  categorySlug: string
): Promise<MockEvent[]> {
  const events = await fetchPublishedEvents({ category: { slug: categorySlug } });
  return events.filter((event) => eventMatchesCategorySlug(event, categorySlug));
}

export async function getEventsByCity(citySlug: string): Promise<MockEvent[]> {
  return fetchPublishedEvents({ city: { slug: citySlug } });
}

export async function getEventsByOrganizer(
  organizerSlug: string
): Promise<MockEvent[]> {
  return fetchPublishedEvents({ organizer: { slug: organizerSlug } });
}

export async function getCategories() {
  if (!isDatabaseConfigured()) return mockCategories;
  const rows = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' }
  });
  const counts = await prisma.event.groupBy({
    by: ['categoryId'],
    where: upcomingFilter,
    _count: true
  });
  const countMap = new Map(counts.map((c) => [c.categoryId, c._count]));
  return rows.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon || '',
    count: countMap.get(c.id) ?? c.eventCount,
    image: resolveCategoryImage(c.slug, c.image)
  }));
}

export async function getCities() {
  if (!isDatabaseConfigured()) return mockCities;
  const rows = await prisma.city.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' }
  });
  const counts = await prisma.event.groupBy({
    by: ['cityId'],
    where: upcomingFilter,
    _count: true
  });
  const countMap = new Map(counts.map((c) => [c.cityId, c._count]));
  return rows.map((c) => ({
    slug: c.slug,
    name: c.name,
    image: c.image || '',
    count: countMap.get(c.id) ?? c.eventCount
  }));
}

export async function getCitiesWithEvents() {
  const cities = await getCities();
  const withEvents = cities
    .filter((city) => city.count > 0)
    .sort((a, b) => b.count - a.count);
  return withEvents.length > 0 ? withEvents : cities;
}

export async function getEventsByCityAndNearby(
  citySlug: string,
  minResults = 6
): Promise<MockEvent[]> {
  const { getNearbyCitySlugs } = await import('@/lib/location/detect-city');
  const primary = await getEventsByCity(citySlug);
  if (primary.length >= minResults) return primary;

  const seen = new Set(primary.map((event) => event.id));
  const combined = [...primary];

  for (const slug of getNearbyCitySlugs(citySlug, 5)) {
    if (slug === citySlug) continue;
    const nearbyEvents = await getEventsByCity(slug);
    for (const event of nearbyEvents) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      combined.push(event);
      if (combined.length >= minResults) return combined;
    }
  }

  return combined;
}

export async function getFavoriteEvents(userId: string): Promise<MockEvent[]> {
  if (!isDatabaseConfigured()) return [];
  const now = new Date();
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: { event: { include: eventInclude } }
  });
  return favorites
    .filter(
      (f) =>
        f.event.deletedAt === null &&
        f.event.status === 'published' &&
        f.event.startDate >= now
    )
    .map((f) => toMockEvent(f.event));
}
