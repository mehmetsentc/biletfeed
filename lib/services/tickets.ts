import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';
import { buildTicketQrPayload } from '@/lib/tickets/sign';
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
  event: {
    slug: string;
    title: string;
    coverImage: string;
    startDate: Date;
    venue: { name: string } | null;
    city: { name: string };
  };
  ticketType: { name: string; price: number };
}): MockPurchasedTicket {
  return {
    id: t.id,
    code: t.ticketCode,
    eventSlug: t.event.slug,
    eventTitle: t.event.title,
    eventImage: t.event.coverImage,
    eventDate: t.event.startDate.toISOString(),
    venue: t.event.venue?.name || 'Online',
    city: t.event.city.name,
    ticketType: t.ticketType.name,
    price: t.ticketType.price,
    status: t.status as MockPurchasedTicket['status'],
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
    const user = await prisma.user.findFirst({
      where: { firebaseUid, deletedAt: null },
      select: { id: true }
    });
    if (!user) return [];

    const tickets = await prisma.purchasedTicket.findMany({
      where: { userId: user.id, deletedAt: null },
      include: {
        event: { include: { city: true, venue: true } },
        ticketType: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return tickets.map(mapTicket);
  } catch {
    // DB şeması henüz migrate edilmemiş olabilir; 500 yerine boş liste dön
    return [];
  }
}

export async function getTicketById(
  id: string,
  firebaseUid?: string
): Promise<MockPurchasedTicket | undefined> {
  if (!isDatabaseConfigured()) return getMockTicketById(id);

  const ticket = await prisma.purchasedTicket.findFirst({
    where: { id, deletedAt: null },
    include: {
      event: { include: { city: true, venue: true } },
      ticketType: true,
      user: { select: { firebaseUid: true } }
    }
  });

  if (!ticket) return undefined;
  if (firebaseUid && ticket.user.firebaseUid !== firebaseUid) return undefined;

  return mapTicket(ticket);
}

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

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Az önce';
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}
