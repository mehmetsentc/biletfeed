import type { Prisma } from '@prisma/client';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { uniqueSlug } from '@/lib/utils/slug';

export type SeatPlan = {
  layout: 'general' | 'sections';
  rows?: number;
  seatsPerRow?: number;
  sections?: Array<{ name: string; capacity: number }>;
  notes?: string;
};

export async function getOrganizerVenues(organizerId: string) {
  await ensureDbConnection();
  const [owned, fromEvents] = await Promise.all([
    prisma.venue.findMany({
      where: { organizerId, deletedAt: null },
      include: { city: { select: { name: true, slug: true } } },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.venue.findMany({
      where: {
        deletedAt: null,
        events: { some: { organizerId, deletedAt: null } }
      },
      include: {
        city: { select: { name: true, slug: true } },
        _count: { select: { events: true } }
      },
      orderBy: { name: 'asc' }
    })
  ]);

  const seen = new Set<string>();
  const merged = [];
  for (const v of [...owned, ...fromEvents]) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    merged.push(v);
  }
  return merged;
}

export async function createOrganizerVenue(
  organizerId: string,
  input: {
    name: string;
    address: string;
    citySlug: string;
    capacity?: number;
    description?: string;
    seatPlan?: SeatPlan;
  }
) {
  await ensureDbConnection();
  const city = await prisma.city.findFirst({
    where: { slug: input.citySlug, deletedAt: null }
  });
  if (!city) throw new Error('Şehir bulunamadı');

  const slug = await uniqueSlug(input.name, async (s) => {
    const row = await prisma.venue.findUnique({ where: { slug: s } });
    return Boolean(row);
  });

  return prisma.venue.create({
    data: {
      slug,
      name: input.name.trim(),
      address: input.address.trim(),
      cityId: city.id,
      organizerId,
      capacity: input.capacity ?? null,
      description: input.description?.trim() || null,
      seatPlan: (input.seatPlan ?? { layout: 'general', rows: 10, seatsPerRow: 20 }) as Prisma.InputJsonValue
    },
    include: { city: { select: { name: true, slug: true } } }
  });
}

export async function updateOrganizerVenue(
  organizerId: string,
  venueId: string,
  input: {
    name?: string;
    address?: string;
    capacity?: number;
    description?: string;
    seatPlan?: SeatPlan;
  }
) {
  await ensureDbConnection();
  const venue = await prisma.venue.findFirst({
    where: {
      id: venueId,
      deletedAt: null,
      OR: [{ organizerId }, { events: { some: { organizerId, deletedAt: null } } }]
    }
  });
  if (!venue) throw new Error('Mekan bulunamadı');

  return prisma.venue.update({
    where: { id: venueId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.address !== undefined ? { address: input.address.trim() } : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
      ...(input.seatPlan !== undefined
        ? { seatPlan: input.seatPlan as Prisma.InputJsonValue }
        : {}),
      ...(venue.organizerId ? {} : { organizerId })
    },
    include: { city: { select: { name: true, slug: true } } }
  });
}

export async function getOrganizerReviews(organizerId: string) {
  await ensureDbConnection();
  return prisma.review.findMany({
    where: {
      deletedAt: null,
      event: { organizerId, deletedAt: null }
    },
    include: {
      user: { select: { displayName: true, email: true } },
      event: { select: { title: true, slug: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 200
  });
}

export async function setReviewHidden(
  organizerId: string,
  reviewId: string,
  hidden: boolean
) {
  await ensureDbConnection();
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      deletedAt: null,
      event: { organizerId, deletedAt: null }
    }
  });
  if (!review) throw new Error('Yorum bulunamadı');

  return prisma.review.update({
    where: { id: reviewId },
    data: { isHidden: hidden }
  });
}

export async function deleteOrganizerReview(organizerId: string, reviewId: string) {
  await ensureDbConnection();
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      deletedAt: null,
      event: { organizerId, deletedAt: null }
    }
  });
  if (!review) throw new Error('Yorum bulunamadı');

  return prisma.review.update({
    where: { id: reviewId },
    data: { deletedAt: new Date(), isHidden: true }
  });
}

export async function getOrganizerSupportTickets(organizerId: string) {
  await ensureDbConnection();
  return prisma.organizerSupportTicket.findMany({
    where: { organizerId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

export async function createOrganizerSupportTicket(
  organizerId: string,
  input: { subject: string; body: string }
) {
  await ensureDbConnection();
  return prisma.organizerSupportTicket.create({
    data: {
      organizerId,
      subject: input.subject.trim(),
      body: input.body.trim()
    }
  });
}

export async function getOrganizerSettings(organizerId: string) {
  await ensureDbConnection();
  return prisma.organizer.findFirst({
    where: { id: organizerId, deletedAt: null },
    select: {
      id: true,
      name: true,
      description: true,
      logo: true,
      coverImage: true,
      contactEmail: true,
      contactPhone: true,
      notifyEmail: true,
      notifySms: true,
      commissionRate: true,
      socialLinks: true,
      slug: true
    }
  });
}

export async function updateOrganizerSettings(
  organizerId: string,
  input: {
    name?: string;
    description?: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
    notifyEmail?: boolean;
    notifySms?: boolean;
    socialLinks?: Record<string, string>;
  }
) {
  await ensureDbConnection();
  return prisma.organizer.update({
    where: { id: organizerId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
      ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone } : {}),
      ...(input.notifyEmail !== undefined ? { notifyEmail: input.notifyEmail } : {}),
      ...(input.notifySms !== undefined ? { notifySms: input.notifySms } : {}),
      ...(input.socialLinks !== undefined
        ? { socialLinks: input.socialLinks as Prisma.InputJsonValue }
        : {})
    }
  });
}

export async function getOrganizerCities() {
  await ensureDbConnection();
  return prisma.city.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, slug: true, name: true }
  });
}
