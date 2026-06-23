import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';
import { mockPurchasedTickets } from '@/lib/data/mock-user';

export type PendingReviewEvent = {
  eventId: string;
  slug: string;
  title: string;
  coverImage: string;
  startDate: string;
  organizerName: string;
  organizerSlug: string;
  venue: string;
  city: string;
};

export type UserReviewItem = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  event: {
    title: string;
    slug: string;
    coverImage: string;
    organizerName: string;
    organizerSlug: string;
  };
};

async function resolveUserId(firebaseUid: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: { id: true }
  });
  return user?.id ?? null;
}

function mapPendingEvent(event: {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  startDate: Date;
  organizer: { name: string; slug: string };
  venue: { name: string } | null;
  city: { name: string };
}): PendingReviewEvent {
  return {
    eventId: event.id,
    slug: event.slug,
    title: event.title,
    coverImage: event.coverImage,
    startDate: event.startDate.toISOString(),
    organizerName: event.organizer.name,
    organizerSlug: event.organizer.slug,
    venue: event.venue?.name || 'Online',
    city: event.city.name
  };
}

function getMockPendingReviews(): PendingReviewEvent[] {
  const now = Date.now();
  const seen = new Set<string>();
  const pending: PendingReviewEvent[] = [];

  for (const ticket of mockPurchasedTickets) {
    if (ticket.status === 'CANCELLED') continue;
    if (new Date(ticket.eventDate).getTime() > now) continue;
    if (seen.has(ticket.eventSlug)) continue;
    seen.add(ticket.eventSlug);

    pending.push({
      eventId: ticket.id,
      slug: ticket.eventSlug,
      title: ticket.eventTitle,
      coverImage: ticket.eventImage,
      startDate: ticket.eventDate,
      organizerName: 'Organizasyon',
      organizerSlug: 'biletfeed',
      venue: ticket.venue,
      city: ticket.city
    });
  }

  return pending;
}

export async function getPendingReviewEventsByFirebaseUid(
  firebaseUid: string
): Promise<PendingReviewEvent[]> {
  if (!isDatabaseConfigured()) return getMockPendingReviews();

  try {
    const userId = await resolveUserId(firebaseUid);
    if (!userId) return [];

    const now = new Date();

    const [tickets, existingReviews] = await Promise.all([
      prisma.purchasedTicket.findMany({
        where: {
          userId,
          deletedAt: null,
          status: { in: ['VALID', 'USED'] }
        },
        include: {
          event: {
            include: {
              organizer: true,
              venue: true,
              city: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.review.findMany({
        where: { userId, deletedAt: null },
        select: { eventId: true }
      })
    ]);

    const reviewedIds = new Set(existingReviews.map((r) => r.eventId));
    const seen = new Set<string>();
    const pending: PendingReviewEvent[] = [];

    for (const ticket of tickets) {
      const event = ticket.event;
      if (event.deletedAt || event.status !== 'published') continue;
      if (event.startDate > now) continue;
      if (reviewedIds.has(event.id)) continue;
      if (seen.has(event.id)) continue;

      seen.add(event.id);
      pending.push(mapPendingEvent(event));
    }

    return pending;
  } catch {
    return [];
  }
}

export async function getUserReviewsByFirebaseUid(
  firebaseUid: string
): Promise<UserReviewItem[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const userId = await resolveUserId(firebaseUid);
    if (!userId) return [];

    const rows = await prisma.review.findMany({
      where: { userId, deletedAt: null },
      include: {
        event: {
          select: {
            title: true,
            slug: true,
            coverImage: true,
            organizer: { select: { name: true, slug: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return rows.map((row) => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
      event: {
        title: row.event.title,
        slug: row.event.slug,
        coverImage: row.event.coverImage,
        organizerName: row.event.organizer.name,
        organizerSlug: row.event.organizer.slug
      }
    }));
  } catch {
    return [];
  }
}

export async function userCanReviewEvent(
  firebaseUid: string,
  eventId: string
): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return mockPurchasedTickets.some(
      (t) =>
        t.id === eventId &&
        t.status !== 'CANCELLED' &&
        new Date(t.eventDate).getTime() <= Date.now()
    );
  }

  const userId = await resolveUserId(firebaseUid);
  if (!userId) return false;

  const now = new Date();

  const [ticket, existing] = await Promise.all([
    prisma.purchasedTicket.findFirst({
      where: {
        userId,
        eventId,
        deletedAt: null,
        status: { in: ['VALID', 'USED'] },
        event: { startDate: { lte: now }, deletedAt: null, status: 'published' }
      }
    }),
    prisma.review.findFirst({
      where: { userId, eventId, deletedAt: null }
    })
  ]);

  return Boolean(ticket && !existing);
}

export async function createUserReview(
  firebaseUid: string,
  input: { eventId: string; rating: number; comment: string }
) {
  if (!isDatabaseConfigured()) {
    throw new Error('Veritabanı yapılandırılmamış');
  }

  const userId = await resolveUserId(firebaseUid);
  if (!userId) throw new Error('Kullanıcı bulunamadı');

  const allowed = await userCanReviewEvent(firebaseUid, input.eventId);
  if (!allowed) {
    throw new Error('Bu etkinlik için değerlendirme yapılamaz');
  }

  return prisma.review.create({
    data: {
      userId,
      eventId: input.eventId,
      rating: input.rating,
      comment: input.comment.trim()
    },
    include: {
      event: {
        select: {
          title: true,
          slug: true,
          coverImage: true,
          organizer: { select: { name: true, slug: true } }
        }
      }
    }
  });
}

/** Mock modda eventId yerine ticket id gelir; gerçek event id'ye çöz */
export async function resolveEventIdForReview(
  firebaseUid: string,
  eventOrTicketId: string
): Promise<string | null> {
  if (!isDatabaseConfigured()) {
    const ticket = mockPurchasedTickets.find((t) => t.id === eventOrTicketId);
    return ticket?.eventSlug ?? null;
  }

  const userId = await resolveUserId(firebaseUid);
  if (!userId) return null;

  const byEvent = await prisma.event.findFirst({
    where: { id: eventOrTicketId, deletedAt: null },
    select: { id: true }
  });
  if (byEvent) return byEvent.id;

  const ticket = await prisma.purchasedTicket.findFirst({
    where: { id: eventOrTicketId, userId, deletedAt: null },
    select: { eventId: true }
  });
  return ticket?.eventId ?? null;
}
