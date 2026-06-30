import { prisma, isDatabaseConfigured, ensureDbConnection } from '@/lib/db/prisma';
import { buildTicketQrPayload, verifyValidationToken } from '@/lib/tickets/sign';
import {
  mockPurchasedTickets,
  mockNotifications,
  getTicketById as getMockTicketById,
  type MockPurchasedTicket
} from '@/lib/data/mock-user';

function mapTicket(t: {
  id: string;
  ticketCode: string;
  validationToken: string;
  status: string;
  attendeeName: string | null;
  event: {
    slug: string;
    title: string;
    coverImage: string;
    startDate: Date;
    endDate: Date;
    venue: { name: string } | null;
    city: { name: string };
  };
  ticketType: { name: string; price: number };
  user: { displayName: string };
  invitation?: { id: string } | null;
}): MockPurchasedTicket {
  return {
    id: t.id,
    code: t.ticketCode,
    validationToken: t.validationToken,
    eventSlug: t.event.slug,
    eventTitle: t.event.title,
    eventImage: t.event.coverImage,
    eventDate: t.event.startDate.toISOString(),
    eventEndDate: t.event.endDate.toISOString(),
    venue: t.event.venue?.name || 'Online',
    city: t.event.city.name,
    ticketType: t.ticketType.name,
    price: t.ticketType.price,
    status: t.status as MockPurchasedTicket['status'],
    attendeeName: t.attendeeName ?? undefined,
    isInvitation: !!t.invitation,
    qrData: buildTicketQrPayload({
      ticketId: t.id,
      ticketCode: t.ticketCode,
      validationToken: t.validationToken
    })
  };
}

export async function getPurchasedTicketsByUser(
  firebaseUid: string
): Promise<MockPurchasedTicket[]> {
  if (!isDatabaseConfigured()) return mockPurchasedTickets;

  try {
    await ensureDbConnection();
    const user = await prisma.user.findFirst({
      where: { firebaseUid, deletedAt: null },
      select: { id: true, displayName: true }
    });
    if (!user) return [];

    const tickets = await prisma.purchasedTicket.findMany({
      where: { userId: user.id, deletedAt: null },
      include: {
        event: { include: { city: true, venue: true } },
        ticketType: true,
        user: { select: { displayName: true } },
        invitation: { select: { id: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return tickets.map(mapTicket);
  } catch {
    return [];
  }
}

export async function getTicketById(
  id: string,
  firebaseUid?: string
): Promise<MockPurchasedTicket | undefined> {
  if (!isDatabaseConfigured()) return getMockTicketById(id);

  await ensureDbConnection();
  const ticket = await prisma.purchasedTicket.findFirst({
    where: { id, deletedAt: null },
    include: {
      event: { include: { city: true, venue: true } },
      ticketType: true,
      user: { select: { firebaseUid: true, displayName: true } }
    }
  });

  if (!ticket) return undefined;
  if (firebaseUid && ticket.user.firebaseUid !== firebaseUid) return undefined;

  return mapTicket({ ...ticket, user: { displayName: ticket.user.displayName } });
}

export { incrementTicketDownload } from '@/lib/services/ticket-validation';

export async function getNotificationsByUser(firebaseUid: string) {
  if (!isDatabaseConfigured()) return mockNotifications;

  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true }
  });
  if (!user) return [];

  const rows = await prisma.notification.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    time: formatRelativeTime(n.createdAt),
    read: n.read,
    type: n.type
  }));
}

/** Public ticket info — shown when guest scans their own QR code. No auth required but token must verify. */
export type PublicTicketInfo = {
  ticketCode: string;
  holderName: string;
  ticketTypeName: string;
  status: string;
  isInvitation: boolean;
  inviteToken: string | null;
  event: {
    title: string;
    coverImage: string;
    startDate: string;
    endDate: string;
    venue: string;
    city: string;
    slug: string;
  };
  qrData: string;
};

export async function getPublicTicketByCode(
  ticketCode: string,
  validationToken: string,
  ticketId: string
): Promise<PublicTicketInfo | null> {
  await ensureDbConnection();

  const ticket = await prisma.purchasedTicket.findFirst({
    where: { ticketCode, deletedAt: null, ...(ticketId ? { id: ticketId } : {}) },
    include: {
      event: {
        include: {
          city: { select: { name: true } },
          venue: { select: { name: true } }
        }
      },
      ticketType: { select: { name: true } },
      user: { select: { displayName: true } },
      invitation: {
        select: { inviteToken: true }
      }
    }
  });

  if (!ticket) return null;
  if (!verifyValidationToken(ticket.id, ticket.eventId, validationToken, ticket.tokenNonce)) return null;

  return {
    ticketCode: ticket.ticketCode,
    holderName: ticket.attendeeName?.trim() || ticket.user.displayName,
    ticketTypeName: ticket.ticketType.name,
    status: ticket.status,
    isInvitation: !!ticket.invitation,
    inviteToken: ticket.invitation?.inviteToken ?? null,
    event: {
      title: ticket.event.title,
      coverImage: ticket.event.coverImage,
      startDate: ticket.event.startDate.toISOString(),
      endDate: ticket.event.endDate.toISOString(),
      venue: ticket.event.venue?.name ?? 'Online',
      city: ticket.event.city.name,
      slug: ticket.event.slug
    },
    qrData: buildTicketQrPayload({
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      validationToken: ticket.validationToken
    })
  };
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Az önce';
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}
