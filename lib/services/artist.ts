import { prisma, ensureDbConnection } from '@/lib/db/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ArtistSocialLinks = {
  instagram?: string;
  twitter?: string;
  spotify?: string;
  youtube?: string;
  soundcloud?: string;
  website?: string;
};

export type ArtistRow = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  image: string | null;
  type: string;
  socialLinks: ArtistSocialLinks;
  verified: boolean;
  followerCount: number;
  createdAt: Date;
};

export type ArtistWithEvents = ArtistRow & {
  events: Array<{
    event: {
      id: string;
      slug: string;
      title: string;
      coverImage: string;
      startDate: Date;
      city: { name: string };
    };
    role: string;
    sortOrder: number;
  }>;
};

// ─── Slug helper ─────────────────────────────────────────────────────────────

export function toArtistSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let n = 2;
  while (true) {
    const existing = await prisma.artist.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true }
    });
    if (!existing) return slug;
    slug = `${base}-${n++}`;
  }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getArtist(slug: string): Promise<ArtistWithEvents | null> {
  await ensureDbConnection();
  const artist = await prisma.artist.findFirst({
    where: { slug, deletedAt: null },
    include: {
      events: {
        include: {
          event: {
            select: {
              id: true,
              slug: true,
              title: true,
              coverImage: true,
              startDate: true,
              city: { select: { name: true } }
            }
          }
        },
        orderBy: [{ event: { startDate: 'asc' } }]
      }
    }
  });
  if (!artist) return null;
  return {
    ...artist,
    socialLinks: (artist.socialLinks as ArtistSocialLinks) ?? {}
  };
}

export async function getArtistById(id: string): Promise<ArtistRow | null> {
  await ensureDbConnection();
  const artist = await prisma.artist.findFirst({
    where: { id, deletedAt: null }
  });
  if (!artist) return null;
  return { ...artist, socialLinks: (artist.socialLinks as ArtistSocialLinks) ?? {} };
}

export async function searchArtists(q: string, limit = 10): Promise<ArtistRow[]> {
  await ensureDbConnection();
  const artists = await prisma.artist.findMany({
    where: {
      deletedAt: null,
      name: { contains: q, mode: 'insensitive' }
    },
    orderBy: [{ followerCount: 'desc' }, { name: 'asc' }],
    take: limit
  });
  return artists.map((a) => ({ ...a, socialLinks: (a.socialLinks as ArtistSocialLinks) ?? {} }));
}

export async function createArtist(data: {
  name: string;
  bio?: string;
  image?: string;
  type?: 'person' | 'group';
  socialLinks?: ArtistSocialLinks;
}): Promise<ArtistRow> {
  await ensureDbConnection();
  const baseSlug = toArtistSlug(data.name);
  const slug = await uniqueSlug(baseSlug);
  const artist = await prisma.artist.create({
    data: {
      slug,
      name: data.name,
      bio: data.bio ?? '',
      image: data.image,
      type: data.type ?? 'person',
      socialLinks: (data.socialLinks ?? {}) as object
    }
  });
  return { ...artist, socialLinks: (artist.socialLinks as ArtistSocialLinks) ?? {} };
}

export async function updateArtist(
  id: string,
  data: {
    name?: string;
    bio?: string;
    image?: string;
    type?: 'person' | 'group';
    socialLinks?: ArtistSocialLinks;
    verified?: boolean;
  }
): Promise<ArtistRow> {
  await ensureDbConnection();
  const artist = await prisma.artist.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.socialLinks !== undefined && { socialLinks: data.socialLinks as object }),
      ...(data.verified !== undefined && { verified: data.verified })
    }
  });
  return { ...artist, socialLinks: (artist.socialLinks as ArtistSocialLinks) ?? {} };
}

// ─── Event linkage ────────────────────────────────────────────────────────────

export async function setEventArtists(
  eventId: string,
  artists: Array<{ artistId: string; role?: string; sortOrder?: number }>
) {
  await ensureDbConnection();
  // Replace all links for this event
  await prisma.$transaction([
    prisma.eventArtist.deleteMany({ where: { eventId } }),
    ...artists.map((a, i) =>
      prisma.eventArtist.create({
        data: {
          eventId,
          artistId: a.artistId,
          role: a.role ?? '',
          sortOrder: a.sortOrder ?? i
        }
      })
    )
  ]);
}

export async function getEventArtists(eventId: string) {
  await ensureDbConnection();
  return prisma.eventArtist.findMany({
    where: { eventId },
    include: {
      artist: {
        select: {
          id: true,
          slug: true,
          name: true,
          image: true,
          type: true,
          verified: true,
          followerCount: true
        }
      }
    },
    orderBy: { sortOrder: 'asc' }
  });
}

// ─── Follow system ────────────────────────────────────────────────────────────

export async function followArtist(userId: string, artistId: string) {
  await ensureDbConnection();
  await prisma.$transaction([
    prisma.artistFollow.upsert({
      where: { userId_artistId: { userId, artistId } },
      create: { userId, artistId },
      update: {}
    }),
    prisma.artist.update({
      where: { id: artistId },
      data: { followerCount: { increment: 1 } }
    })
  ]);
}

export async function unfollowArtist(userId: string, artistId: string) {
  await ensureDbConnection();
  const deleted = await prisma.artistFollow.deleteMany({
    where: { userId, artistId }
  });
  if (deleted.count > 0) {
    await prisma.artist.update({
      where: { id: artistId },
      data: { followerCount: { decrement: 1 } }
    });
  }
}

export async function isFollowingArtist(userId: string, artistId: string): Promise<boolean> {
  await ensureDbConnection();
  const follow = await prisma.artistFollow.findUnique({
    where: { userId_artistId: { userId, artistId } },
    select: { userId: true }
  });
  return follow !== null;
}

export async function getFollowedArtists(userId: string): Promise<ArtistRow[]> {
  await ensureDbConnection();
  const follows = await prisma.artistFollow.findMany({
    where: { userId },
    include: {
      artist: true
    },
    orderBy: { createdAt: 'desc' }
  });
  return follows
    .filter((f) => !f.artist.deletedAt)
    .map((f) => ({
      ...f.artist,
      socialLinks: (f.artist.socialLinks as ArtistSocialLinks) ?? {}
    }));
}
