import { prisma, isDatabaseConfigured, ensureDbConnection } from '@/lib/db/prisma';
import type { Prisma, EventStatus } from '@prisma/client';
import {
  categories as mockCategories,
  cities as mockCities,
  type MockEvent
} from '@/lib/data/mock-events';
import { resolveCategoryImage } from '@/lib/data/category-images';
import { sortCategoriesByDisplayOrder } from '@/lib/categories/sort';
import { eventInclude, toMockEvent, type EventWithRelations } from '@/lib/mappers/event';
import { mapCategory } from '@/lib/scraper/normalize';
import {
  isUpcomingEvent,
  upcomingStartFilter as buildUpcomingStartFilter
} from '@/lib/events/upcoming';

export { isUpcomingEvent, upcomingStartFilter } from '@/lib/events/upcoming';

/** Başlık açıkça başka kategoriye işaret ediyorsa yanlış DB kaydını filtrele */
function eventMatchesCategorySlug(
  event: { title: string; description: string; categorySlug: string },
  categorySlug: string
): boolean {
  const fromTitle = mapCategory(event.title, event.description);
  // Varsayılan ('diger') değilse başlığın belirlediği kategoriyi kullan
  if (fromTitle.categorySlug !== 'diger') {
    return fromTitle.categorySlug === categorySlug;
  }
  // Başlıktan belirlenemedi — DB'deki kategoriye güven
  return event.categorySlug === categorySlug;
}

export const publishedFilter = {
  status: 'published' as const,
  deletedAt: null
};

export function buildUpcomingFilter(now = new Date()) {
  return {
    ...publishedFilter,
    ...buildUpcomingStartFilter(now)
  };
}

export function buildInternalPublicFilter(now = new Date()) {
  return {
    ...buildUpcomingFilter(now),
    listingType: 'internal' as const
  };
}

/** @deprecated Her sorguda buildUpcomingFilter() kullanın — bu sabit zamanı dondurur. */
export const upcomingFilter = buildUpcomingFilter();

/** @deprecated Her sorguda buildInternalPublicFilter() kullanın. */
export const internalPublicFilter = buildInternalPublicFilter();

export const internalPublishedFilter = {
  ...publishedFilter,
  listingType: 'internal' as const
};

async function fetchPublishedEvents(
  where?: Prisma.EventWhereInput,
  options?: { upcomingOnly?: boolean }
) {
  if (!isDatabaseConfigured()) return [];
  await ensureDbConnection();
  const now = new Date();
  const baseWhere =
    options?.upcomingOnly !== false
      ? buildInternalPublicFilter(now)
      : internalPublishedFilter;
  const events = await prisma.event.findMany({
    where: { ...baseWhere, ...where },
    include: eventInclude,
    orderBy: { startDate: 'asc' }
  });
  return events.map(toMockEvent).filter((event) => isUpcomingEvent(event, now));
}

export async function getAllEvents(): Promise<MockEvent[]> {
  return fetchPublishedEvents();
}

export async function getEventBySlug(
  slug: string
): Promise<MockEvent | undefined> {
  if (!isDatabaseConfigured()) return undefined;
  await ensureDbConnection();
  const now = new Date();
  const event = await prisma.event.findFirst({
    where: { slug, ...buildInternalPublicFilter(now) },
    include: eventInclude
  });
  return event ? toMockEvent(event) : undefined;
}

export async function getFeaturedEvents(): Promise<MockEvent[]> {
  return fetchPublishedEvents({ isFeatured: true });
}

export async function getTrendingEvents(): Promise<MockEvent[]> {
  return fetchPublishedEvents({ isTrending: true });
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
  categorySlug: string,
  citySlug?: string
): Promise<MockEvent[]> {
  const where: Prisma.EventWhereInput = { category: { slug: categorySlug } };
  if (citySlug) where.city = { slug: citySlug };
  // DB kategori kaydı esas alınır — text-matching post-filtresi hatalı sonuç veriyordu
  return fetchPublishedEvents(where);
}

export interface CategoryStrip {
  slug: string;
  name: string;
  emoji: string;
  events: MockEvent[];
}

const HOMEPAGE_CATEGORIES = [
  { slug: 'muzik', name: 'Konser', emoji: '🎵' },
  { slug: 'tiyatro', name: 'Tiyatro', emoji: '🎭' },
  { slug: 'festival', name: 'Festival', emoji: '🎪' },
  { slug: 'spor', name: 'Spor', emoji: '⚽' },
  { slug: 'sanat', name: 'Sanat & Sergi', emoji: '🎨' },
  { slug: 'komedi', name: 'Stand-up & Komedi', emoji: '😄' },
];

export async function getHomepageCategoryStrips(
  citySlug?: string
): Promise<CategoryStrip[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureDbConnection();

  const now = new Date();
  const where: Prisma.EventWhereInput = {
    ...buildInternalPublicFilter(now),
    category: { slug: { in: HOMEPAGE_CATEGORIES.map((c) => c.slug) } },
    ...(citySlug ? { city: { slug: citySlug } } : {})
  };

  const events = await prisma.event.findMany({
    where,
    include: eventInclude,
    orderBy: { startDate: 'asc' },
    take: 200
  });

  const mapped = events.map(toMockEvent).filter((event) => isUpcomingEvent(event, now));
  const bySlug = new Map<string, MockEvent[]>();
  for (const cat of HOMEPAGE_CATEGORIES) bySlug.set(cat.slug, []);
  for (const ev of mapped) {
    bySlug.get(ev.categorySlug)?.push(ev);
  }

  return HOMEPAGE_CATEGORIES
    .map((cat) => ({ ...cat, events: (bySlug.get(cat.slug) ?? []).slice(0, 8) }))
    .filter((strip) => strip.events.length >= 2);
}

export async function getEventsByCity(citySlug: string): Promise<MockEvent[]> {
  return fetchPublishedEvents({ city: { slug: citySlug } });
}

export async function getEventsByOrganizer(
  organizerSlug: string
): Promise<MockEvent[]> {
  return fetchPublishedEvents({ organizer: { slug: organizerSlug } });
}

export async function getEventsByOrganizerForProfile(
  organizerSlug: string,
  viewerUserId?: string | null
): Promise<{ events: MockEvent[]; isOwner: boolean }> {
  if (!isDatabaseConfigured()) {
    return { events: [], isOwner: false };
  }
  await ensureDbConnection();

  const organizer = await prisma.organizer.findFirst({
    where: { slug: organizerSlug, deletedAt: null },
    select: { id: true, owner: { select: { firebaseUid: true } } }
  });
  if (!organizer) {
    return { events: [], isOwner: false };
  }

  const isOwner = Boolean(
    viewerUserId && viewerUserId === organizer.owner.firebaseUid
  );
  const ownerStatuses: EventStatus[] = ['draft', 'pending', 'published'];
  const statusFilter: EventStatus | Prisma.EnumEventStatusFilter = isOwner
    ? { in: ownerStatuses }
    : 'published';

  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      organizerId: organizer.id,
      deletedAt: null,
      status: statusFilter,
      listingType: 'internal',
      ...(isOwner ? {} : buildUpcomingStartFilter(now))
    },
    include: eventInclude,
    orderBy: { startDate: 'desc' }
  });

  return { events: events.map((event) => toMockEvent(event as EventWithRelations)), isOwner };
}

export type EventViewerResult = {
  event: MockEvent;
  isPreview: boolean;
  previewKind: 'draft' | 'pending' | null;
};

export async function getEventBySlugForViewer(
  slug: string,
  viewerUserId?: string | null
): Promise<EventViewerResult | undefined> {
  if (!isDatabaseConfigured()) return undefined;
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { slug, deletedAt: null },
    include: {
      ...eventInclude,
      organizer: { select: { owner: { select: { firebaseUid: true } }, name: true, slug: true } }
    }
  });
  if (!event) return undefined;

  const isOwner = Boolean(
    viewerUserId && viewerUserId === event.organizer.owner.firebaseUid
  );

  let isAdminViewer = false;
  if (viewerUserId && !isOwner) {
    const viewer = await prisma.user.findFirst({
      where: { firebaseUid: viewerUserId, deletedAt: null },
      select: { role: true }
    });
    isAdminViewer =
      viewer?.role === 'ROLE_ADMIN' || viewer?.role === 'ROLE_SUPER_ADMIN';
  }

  const canPreviewUnpublished =
    isOwner || isAdminViewer;

  if (
    (event.status === 'published' || event.status === 'completed') &&
    event.listingType === 'internal'
  ) {
    return {
      event: toMockEvent(event),
      isPreview: false,
      previewKind: null
    };
  }

  if (
    canPreviewUnpublished &&
    event.listingType === 'internal' &&
    (event.status === 'draft' || event.status === 'pending')
  ) {
    return {
      event: toMockEvent(event),
      isPreview: true,
      previewKind: event.status
    };
  }

  return undefined;
}

export async function getCategories() {
  if (!isDatabaseConfigured()) {
    return sortCategoriesByDisplayOrder(mockCategories).filter((c) => c.count > 0);
  }
  const rows = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' }
  });
  const now = new Date();
  const publicFilter = buildInternalPublicFilter(now);
  const counts = await prisma.event.groupBy({
    by: ['categoryId'],
    where: publicFilter,
    _count: true
  });
  const countMap = new Map(counts.map((c) => [c.categoryId, c._count]));
  return sortCategoriesByDisplayOrder(
    rows.map((c) => ({
      slug: c.slug,
      name: c.name,
      icon: c.icon || '',
      count: countMap.get(c.id) ?? 0,
      image: resolveCategoryImage(c.slug, c.image)
    }))
  ).filter((c) => c.count > 0);
}

export async function getCities() {
  if (!isDatabaseConfigured()) return mockCities;
  const rows = await prisma.city.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' }
  });
  const now = new Date();
  const publicFilter = buildInternalPublicFilter(now);
  const counts = await prisma.event.groupBy({
    by: ['cityId'],
    where: publicFilter,
    _count: true
  });
  const countMap = new Map(counts.map((c) => [c.cityId, c._count]));
  return rows.map((c) => ({
    slug: c.slug,
    name: c.name,
    image: c.image || '',
    count: countMap.get(c.id) ?? 0
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
      if (combined.length >= minResults) {
        return sortByStartDateAsc(combined);
      }
    }
  }

  return sortByStartDateAsc(combined);
}

function sortByStartDateAsc(events: MockEvent[]): MockEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
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
