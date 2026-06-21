import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';
import {
  mockVenues,
  getVenueBySlug as getMockVenueBySlug,
  type MockVenue
} from '@/lib/data/mock-venues';

function toMockVenue(row: {
  id: string;
  slug: string;
  name: string;
  address: string;
  capacity: number | null;
  image: string | null;
  description: string | null;
  eventCount: number;
  city: { name: string; slug: string };
}): MockVenue {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city.name,
    citySlug: row.city.slug,
    address: row.address,
    capacity: row.capacity ?? 0,
    image:
      row.image ||
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    eventCount: row.eventCount,
    description: row.description || ''
  };
}

export async function getAllVenues(): Promise<MockVenue[]> {
  if (!isDatabaseConfigured()) return mockVenues;
  const rows = await prisma.venue.findMany({
    where: { deletedAt: null },
    include: { city: true },
    orderBy: { name: 'asc' }
  });
  return rows.map(toMockVenue);
}

export async function getVenueBySlug(
  slug: string
): Promise<MockVenue | undefined> {
  if (!isDatabaseConfigured()) return getMockVenueBySlug(slug);
  const row = await prisma.venue.findFirst({
    where: { slug, deletedAt: null },
    include: { city: true }
  });
  return row ? toMockVenue(row) : undefined;
}
