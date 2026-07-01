import { prisma, isDatabaseConfigured, ensureDbConnection } from '@/lib/db/prisma';
import type { MockOrganizer } from '@/lib/data/mock-organizers';
import type { FavoriteVenue } from '@/lib/services/favorites';

export type FollowTargetType = 'organizer' | 'venue';

async function resolveUserId(firebaseUid: string): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureDbConnection();
  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true }
  });
  return user?.id ?? null;
}

export async function getFollowedOrganizerIds(
  firebaseUid: string
): Promise<Set<string>> {
  if (!isDatabaseConfigured()) return new Set();
  try {
    const userId = await resolveUserId(firebaseUid);
    if (!userId) return new Set();
    const rows = await prisma.follower.findMany({
      where: { userId },
      select: { organizerId: true }
    });
    return new Set(rows.map((r) => r.organizerId));
  } catch {
    return new Set();
  }
}

export async function getFollowedVenueIds(
  firebaseUid: string
): Promise<Set<string>> {
  if (!isDatabaseConfigured()) return new Set();
  try {
    const userId = await resolveUserId(firebaseUid);
    if (!userId) return new Set();
    const rows = await prisma.venueFollow.findMany({
      where: { userId },
      select: { venueId: true }
    });
    return new Set(rows.map((r) => r.venueId));
  } catch {
    return new Set();
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

export async function getFollowedVenuesByFirebaseUid(
  firebaseUid: string
): Promise<FavoriteVenue[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const userId = await resolveUserId(firebaseUid);
    if (!userId) return [];

    const rows = await prisma.venueFollow.findMany({
      where: { userId },
      include: {
        venue: { include: { city: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return rows
      .filter((row) => row.venue.deletedAt === null)
      .map((row) => ({
        id: row.venue.id,
        slug: row.venue.slug,
        name: row.venue.name,
        city: row.venue.city.name,
        image: row.venue.image ?? undefined
      }));
  } catch {
    return [];
  }
}

export async function toggleFollowOrganizer(
  firebaseUid: string,
  organizerId: string
): Promise<{ active: boolean }> {
  if (!isDatabaseConfigured()) return { active: false };

  const userId = await resolveUserId(firebaseUid);
  if (!userId) throw new Error('Kullanıcı bulunamadı');

  const organizer = await prisma.organizer.findFirst({
    where: { id: organizerId, deletedAt: null }
  });
  if (!organizer) throw new Error('Organizatör bulunamadı');

  const existing = await prisma.follower.findUnique({
    where: { userId_organizerId: { userId, organizerId } }
  });

  if (existing) {
    await prisma.$transaction([
      prisma.follower.delete({ where: { id: existing.id } }),
      prisma.organizer.update({
        where: { id: organizerId },
        data: { followerCount: { decrement: 1 } }
      })
    ]);
    return { active: false };
  }

  await prisma.$transaction([
    prisma.follower.create({ data: { userId, organizerId } }),
    prisma.organizer.update({
      where: { id: organizerId },
      data: { followerCount: { increment: 1 } }
    })
  ]);
  return { active: true };
}

export async function toggleFollowVenue(
  firebaseUid: string,
  venueId: string
): Promise<{ active: boolean }> {
  if (!isDatabaseConfigured()) return { active: false };

  const userId = await resolveUserId(firebaseUid);
  if (!userId) throw new Error('Kullanıcı bulunamadı');

  const venue = await prisma.venue.findFirst({
    where: { id: venueId, deletedAt: null }
  });
  if (!venue) throw new Error('Mekan bulunamadı');

  const existing = await prisma.venueFollow.findUnique({
    where: { userId_venueId: { userId, venueId } }
  });

  if (existing) {
    await prisma.venueFollow.delete({ where: { id: existing.id } });
    return { active: false };
  }

  await prisma.venueFollow.create({ data: { userId, venueId } });
  return { active: true };
}

export async function toggleFollow(
  firebaseUid: string,
  type: FollowTargetType,
  targetId: string
): Promise<{ active: boolean }> {
  if (type === 'organizer') {
    return toggleFollowOrganizer(firebaseUid, targetId);
  }
  return toggleFollowVenue(firebaseUid, targetId);
}
