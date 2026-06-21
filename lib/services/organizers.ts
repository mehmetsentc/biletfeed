import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';
import {
  mockOrganizers,
  type MockOrganizer,
  getOrganizerBySlug as getMockOrganizerBySlug
} from '@/lib/data/mock-organizers';

function toMockOrganizer(row: {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string | null;
  coverImage: string | null;
  followerCount: number;
  verified: boolean;
  _count?: { events: number };
}): MockOrganizer {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    logo: row.logo ?? undefined,
    coverImage:
      row.coverImage ||
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    followerCount: row.followerCount,
    eventCount: row._count?.events ?? 0,
    verified: row.verified
  };
}

export async function getAllOrganizers(): Promise<MockOrganizer[]> {
  if (!isDatabaseConfigured()) return mockOrganizers;
  const rows = await prisma.organizer.findMany({
    where: { deletedAt: null, status: 'approved' },
    include: { _count: { select: { events: true } } },
    orderBy: { followerCount: 'desc' }
  });
  return rows.map(toMockOrganizer);
}

export async function getOrganizerBySlug(
  slug: string
): Promise<MockOrganizer | undefined> {
  if (!isDatabaseConfigured()) return getMockOrganizerBySlug(slug);
  const row = await prisma.organizer.findFirst({
    where: { slug, deletedAt: null },
    include: { _count: { select: { events: true } } }
  });
  return row ? toMockOrganizer(row) : undefined;
}
