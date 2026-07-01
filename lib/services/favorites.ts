import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';
import type { MockEvent } from '@/lib/data/mock-events';
import { eventInclude, toMockEvent } from '@/lib/mappers/event';

export type FavoriteVenue = {
  id: string;
  slug: string;
  name: string;
  city: string;
  image?: string;
};
export {
  getFollowedOrganizersByFirebaseUid,
  getFollowedVenuesByFirebaseUid as getFavoriteVenuesByFirebaseUid
} from '@/lib/services/follows';

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
