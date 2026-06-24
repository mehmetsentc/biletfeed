import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';
import type { MockEvent } from '@/lib/data/mock-events';
import type { MockOrganizer } from '@/lib/data/mock-organizers';
import { eventInclude, toMockEvent } from '@/lib/mappers/event';

export type FavoriteVenue = {
  id: string;
  slug: string;
  name: string;
  city: string;
  image?: string;
};

async function resolveUserId(firebaseUid: string): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true }
  });
  return user?.id ?? null;
}

export async function getFavoriteEventsByFirebaseUid(
  firebaseUid: string
): Promise<MockEvent[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const userId = await resolveUserId(firebaseUid);
    if (!userId) return [];

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { event: { include: eventInclude } },
      orderBy: { createdAt: 'desc' }
    });

    return favorites
      .filter(
        (favorite) =>
          favorite.event.deletedAt === null && favorite.event.status === 'published'
      )
      .map((favorite) => toMockEvent(favorite.event));
  } catch {
    return [];
  }
}

export async function getFollowedOrganizersByFirebaseUid(
  firebaseUid: string
): Promise<MockOrganizer[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const userId = await resolveUserId(firebaseUid);
    if (!userId) return [];

    const rows = await prisma.follower.findMany({
      where: { userId },
      include: {
        organizer: {
          include: { _count: { select: { events: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return rows
      .filter((row) => row.organizer.deletedAt === null)
      .map((row) => ({
        id: row.organizer.id,
        slug: row.organizer.slug,
        name: row.organizer.name,
        description: row.organizer.description,
        logo: row.organizer.logo ?? undefined,
        coverImage:
          row.organizer.coverImage ??
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
        followerCount: row.organizer.followerCount,
        eventCount: row.organizer._count.events,
        verified: row.organizer.verified
      }));
  } catch {
    return [];
  }
}

export async function getFavoriteVenuesByFirebaseUid(
  _firebaseUid: string
): Promise<FavoriteVenue[]> {
  return [];
}

/**
 * Toggle favorite: adds if not exists, removes if exists.
 * Returns { active: boolean } — true if now favorited.
 */
export async function toggleFavoriteEvent(
  firebaseUid: string,
  eventId: string
): Promise<{ active: boolean }> {
  if (!isDatabaseConfigured()) return { active: false };

  const userId = await resolveUserId(firebaseUid);
  if (!userId) throw new Error('Kullanıcı bulunamadı');

  const existing = await prisma.favorite.findUnique({
    where: { userId_eventId: { userId, eventId } }
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { active: false };
  }

  await prisma.favorite.create({ data: { userId, eventId } });
  return { active: true };
}

/** Returns Set of favorited eventIds for the user (for initial page state). */
export async function getFavoriteEventIds(
  firebaseUid: string
): Promise<Set<string>> {
  if (!isDatabaseConfigured()) return new Set();
  try {
    const userId = await resolveUserId(firebaseUid);
    if (!userId) return new Set();
    const rows = await prisma.favorite.findMany({
      where: { userId },
      select: { eventId: true }
    });
    return new Set(rows.map((r) => r.eventId));
  } catch {
    return new Set();
  }
}
