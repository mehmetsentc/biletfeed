import { randomBytes, randomUUID } from 'crypto';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import {
  buildTicketQrPayload,
  generateTicketCode,
  generateValidationToken,
  newTicketId
} from '@/lib/tickets/sign';
import { getSiteUrl } from '@/lib/config/domain';
import { sendEmail } from '@/lib/email/resend';
import { buildInvitationEmail } from '@/lib/email/invitation-template';

function createInviteToken(): string {
  return randomBytes(16).toString('hex');
}

async function findOrCreateGuestUser(name: string, email?: string) {
  const normalizedEmail =
    email?.trim().toLowerCase() ||
    `misafir+${randomUUID()}@davetiye.biletfeed.local`;

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });
  if (existing) {
    if (name && existing.displayName !== name) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { displayName: name }
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      firebaseUid: `invite-${randomUUID()}`,
      email: normalizedEmail,
      displayName: name,
      role: 'ROLE_USER'
    }
  });
}

export type InvitationRow = {
  id: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  inviteToken: string;
  personalMessage: string | null;
  status: string;
  createdAt: string;
  inviteUrl: string;
  qrData: string;
  ticketCode: string;
  ticketTypeName: string;
  eventTitle: string;
};

function mapInvitation(row: {
  id: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  inviteToken: string;
  personalMessage: string | null;
  status: string;
  createdAt: Date;
  purchasedTicket: {
    ticketCode: string;
    validationToken: string;
    id: string;
  };
  ticketType: { name: string };
  event: { title: string };
}): InvitationRow {
  return {
    id: row.id,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestPhone: row.guestPhone,
    inviteToken: row.inviteToken,
    personalMessage: row.personalMessage,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    inviteUrl: getSiteUrl(`/davetiye/${row.inviteToken}`),
    qrData: buildTicketQrPayload({
      ticketId: row.purchasedTicket.id,
      ticketCode: row.purchasedTicket.ticketCode,
      validationToken: row.purchasedTicket.validationToken
    }),
    ticketCode: row.purchasedTicket.ticketCode,
    ticketTypeName: row.ticketType.name,
    eventTitle: row.event.title
  };
}

const invitationInclude = {
  purchasedTicket: {
    select: { id: true, ticketCode: true, validationToken: true }
  },
  ticketType: { select: { name: true } },
  event: { select: { title: true } }
} as const;

export async function listEventInvitations(
  organizerId: string,
  eventId?: string
): Promise<InvitationRow[]> {
  await ensureDbConnection();
  const rows = await prisma.eventInvitation.findMany({
    where: {
      organizerId,
      deletedAt: null,
      ...(eventId ? { eventId } : {})
    },
    include: invitationInclude,
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  return rows.map(mapInvitation);
}

export async function createEventInvitation(params: {
  organizerId: string;
  eventId: string;
  ticketTypeId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  personalMessage?: string;
}): Promise<InvitationRow> {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: {
      id: params.eventId,
      organizerId: params.organizerId,
      deletedAt: null
    },
    include: {
      ticketTypes: {
        where: { id: params.ticketTypeId, deletedAt: null, status: 'active' }
      },
      venue: { select: { name: true } },
      city: { select: { name: true } }
    }
  });

  if (!event) throw new Error('Etkinlik bulunamadı');
  const ticketType = event.ticketTypes[0];
  if (!ticketType) throw new Error('Bilet türü bulunamadı');
  if (ticketType.sold >= ticketType.capacity) {
    throw new Error('Bu bilet türü için kontenjan kalmadı');
  }

  const guest = await findOrCreateGuestUser(params.guestName, params.guestEmail);
  const inviteToken = createInviteToken();
  const ticketId = newTicketId();
  const ticketCode = generateTicketCode();
  const validationToken = generateValidationToken(ticketId, params.eventId);

  const invitation = await prisma.$transaction(async (tx) => {
    const reserved = await tx.ticketType.updateMany({
      where: {
        id: params.ticketTypeId,
        sold: { lt: ticketType.capacity }
      },
      data: { sold: { increment: 1 } }
    });
    if (reserved.count === 0) throw new Error('Yeterli bilet kalmadı');

    const order = await tx.order.create({
      data: {
        userId: guest.id,
        eventId: params.eventId,
        organizerId: params.organizerId,
        subtotal: 0,
        total: 0,
        status: 'paid',
        paymentProvider: 'invitation',
        paymentId: `invite_${inviteToken}`,
        paidAt: new Date(),
        items: {
          create: {
            ticketTypeId: params.ticketTypeId,
            quantity: 1,
            unitPrice: 0
          }
        }
      }
    });

    await tx.transaction.create({
      data: {
        orderId: order.id,
        organizerId: params.organizerId,
        amount: 0,
        status: 'completed',
        provider: 'invitation',
        providerRef: inviteToken
      }
    });

    await tx.purchasedTicket.create({
      data: {
        id: ticketId,
        orderId: order.id,
        ticketTypeId: params.ticketTypeId,
        userId: guest.id,
        eventId: params.eventId,
        ticketCode,
        validationToken,
        status: 'VALID'
      }
    });

    return tx.eventInvitation.create({
      data: {
        eventId: params.eventId,
        organizerId: params.organizerId,
        purchasedTicketId: ticketId,
        ticketTypeId: params.ticketTypeId,
        guestName: params.guestName.trim(),
        guestEmail: params.guestEmail?.trim() || null,
        guestPhone: params.guestPhone?.trim() || null,
        inviteToken,
        personalMessage: params.personalMessage?.trim() || null
      },
      include: invitationInclude
    });
  });

  const result = mapInvitation(invitation);

  // Auto-send email to guest if they provided an address
  if (params.guestEmail) {
    const eventDate = new Date(event.startDate).toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const venueName = event.venue?.name ?? 'Online';
    const cityName = event.city.name;

    void sendEmail({
      to: params.guestEmail,
      subject: `Davetiyeniz: ${event.title}`,
      html: buildInvitationEmail({
        guestName: params.guestName,
        eventTitle: event.title,
        eventDate,
        eventVenue: venueName,
        eventCity: cityName,
        coverImage: event.coverImage ?? '',
        ticketTypeName: ticketType.name,
        ticketCode: result.ticketCode,
        personalMessage: params.personalMessage,
        inviteUrl: result.inviteUrl
      })
    });
  }

  return result;
}

export async function getPublicInvitation(token: string) {
  await ensureDbConnection();
  const row = await prisma.eventInvitation.findFirst({
    where: { inviteToken: token, deletedAt: null, status: { not: 'cancelled' } },
    include: {
      purchasedTicket: {
        select: {
          id: true,
          ticketCode: true,
          validationToken: true,
          status: true
        }
      },
      ticketType: { select: { name: true } },
      event: {
        select: {
          title: true,
          coverImage: true,
          startDate: true,
          endDate: true,
          slug: true,
          venue: { select: { name: true } },
          city: { select: { name: true } }
        }
      }
    }
  });

  if (!row) return null;

  if (row.status === 'sent') {
    await prisma.eventInvitation.update({
      where: { id: row.id },
      data: { status: 'viewed', viewedAt: new Date() }
    });
  }

  return {
    guestName: row.guestName,
    personalMessage: row.personalMessage,
    ticketCode: row.purchasedTicket.ticketCode,
    ticketStatus: row.purchasedTicket.status,
    ticketTypeName: row.ticketType.name,
    event: {
      title: row.event.title,
      coverImage: row.event.coverImage,
      startDate: row.event.startDate.toISOString(),
      endDate: row.event.endDate.toISOString(),
      slug: row.event.slug,
      venue: row.event.venue?.name || 'Online',
      city: row.event.city.name
    },
    qrData: buildTicketQrPayload({
      ticketId: row.purchasedTicket.id,
      ticketCode: row.purchasedTicket.ticketCode,
      validationToken: row.purchasedTicket.validationToken
    }),
    inviteUrl: getSiteUrl(`/davetiye/${row.inviteToken}`)
  };
}

export async function listPendingOrdersForEvent(
  organizerId: string,
  eventId: string
) {
  await ensureDbConnection();
  return prisma.order.findMany({
    where: {
      organizerId,
      eventId,
      status: 'pending',
      deletedAt: null
    },
    include: {
      user: { select: { displayName: true, email: true } },
      items: { include: { ticketType: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}

export async function getEventTicketTypes(eventId: string, organizerId: string) {
  await ensureDbConnection();
  return prisma.ticketType.findMany({
    where: {
      eventId,
      deletedAt: null,
      status: 'active',
      event: { organizerId, deletedAt: null }
    },
    select: {
      id: true,
      name: true,
      price: true,
      capacity: true,
      sold: true
    },
    orderBy: { price: 'asc' }
  });
}
