import { randomBytes } from 'crypto';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import {
  buildTicketQrPayload,
  generateTicketCode,
  generateValidationToken,
  newTicketId
} from '@/lib/tickets/sign';
import { getSiteUrl } from '@/lib/config/domain';
import { queueEmail } from '@/lib/accounting/email';
import {
  buildInvitationCalendarUrl,
  buildInvitationEmail,
  buildInvitationPlainText
} from '@/lib/email/invitation-template';
import { qrToDataUrl } from '@/lib/tickets/design/qr-data-url';
import { generateOrganizerInvitationPdf } from '@/lib/services/invitation-pdf';
import { findOrCreateGuestUser } from '@/lib/services/guest-user';
import {
  formatTurkeyDateLong,
  formatTurkeyTime
} from '@/lib/datetime/istanbul';

function createInviteToken(): string {
  return randomBytes(16).toString('hex');
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
  pdfUrl: string;
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
    eventTitle: row.event.title,
    pdfUrl: `/api/organizer/invitations/${row.id}/pdf`
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

const invitationEmailInclude = {
  purchasedTicket: {
    select: { id: true, ticketCode: true, validationToken: true, orderId: true }
  },
  ticketType: { select: { name: true } },
  event: {
    select: {
      title: true,
      coverImage: true,
      startDate: true,
      endDate: true,
      organizer: { select: { name: true } },
      venue: { select: { name: true, address: true } },
      city: { select: { name: true } }
    }
  }
} as const;

/** Tek davetiye e-postası — PDF eki ile */
export async function sendEventInvitationEmail(
  invitationId: string,
  organizerId: string
): Promise<{ status: 'sent' | 'skipped' | 'failed'; error?: string }> {
  await ensureDbConnection();

  const row = await prisma.eventInvitation.findFirst({
    where: { id: invitationId, organizerId, deletedAt: null },
    include: invitationEmailInclude
  });

  if (!row?.guestEmail?.trim()) {
    return { status: 'skipped' };
  }

  const eventDate = formatTurkeyDateLong(row.event.startDate);
  const eventTime = formatTurkeyTime(row.event.startDate);
  const venueName = row.event.venue?.name ?? 'Online';
  const cityName = row.event.city.name;
  const inviteUrl = getSiteUrl(`/davetiye/${row.inviteToken}`);
  const calendarUrl = buildInvitationCalendarUrl({
    title: row.event.title,
    startDate: row.event.startDate,
    endDate: row.event.endDate,
    venue: venueName,
    city: cityName,
    address: row.event.venue?.address,
    inviteUrl
  });

  const qrDataUrl = await qrToDataUrl(inviteUrl);
  const pdf = await generateOrganizerInvitationPdf(invitationId, organizerId);

  const result = await queueEmail({
    to: row.guestEmail.trim(),
    subject: `BiletFeed — ${row.event.title} davetiyeniz`,
    template: 'event_invitation',
    sender: 'invitation',
    html: buildInvitationEmail({
      guestName: row.guestName,
      eventTitle: row.event.title,
      eventDate,
      eventTime,
      eventVenue: venueName,
      eventCity: cityName,
      coverImage: row.event.coverImage ?? '',
      ticketTypeName: row.ticketType.name,
      ticketCode: row.purchasedTicket.ticketCode,
      qrDataUrl,
      personalMessage: row.personalMessage ?? undefined,
      inviteUrl,
      calendarUrl,
      organizerName: row.event.organizer.name
    }),
    text: buildInvitationPlainText({
      guestName: row.guestName,
      eventTitle: row.event.title,
      eventDate,
      eventTime,
      eventVenue: venueName,
      eventCity: cityName,
      ticketCode: row.purchasedTicket.ticketCode,
      inviteUrl
    }),
    orderId: row.purchasedTicket.orderId,
    attachments: pdf ? [{ filename: pdf.filename, content: pdf.buffer }] : undefined
  });

  if (result.status !== 'sent') {
    return {
      status: 'failed',
      error: result.error ?? 'E-posta gönderilemedi'
    };
  }

  return { status: 'sent' };
}

export async function createEventInvitation(params: {
  organizerId: string;
  eventId: string;
  ticketTypeId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  personalMessage?: string;
  /** Toplu gönderimde e-posta toplu işlem sonunda gönderilir */
  skipEmail?: boolean;
}): Promise<InvitationRow & { emailStatus?: 'sent' | 'skipped' | 'failed'; emailError?: string }> {
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
      organizer: { select: { name: true } },
      venue: { select: { name: true, address: true } },
      city: { select: { name: true } }
    }
  });

  if (!event) throw new Error('Etkinlik bulunamadı');
  const ticketType = event.ticketTypes[0];
  if (!ticketType) throw new Error('Bilet türü bulunamadı');

  const guest = await findOrCreateGuestUser(params.guestName, params.guestEmail);
  const inviteToken = createInviteToken();
  const ticketId = newTicketId();
  const ticketCode = generateTicketCode();
  const validationToken = generateValidationToken(ticketId, params.eventId);

  const { invitation } = await prisma.$transaction(async (tx) => {
    // Güncel kapasiteyi transaction içinde kilitle — stale sold kontrolü yok
    const reserved = await tx.ticketType.updateMany({
      where: {
        id: params.ticketTypeId,
        deletedAt: null,
        status: 'active',
        sold: { lt: ticketType.capacity }
      },
      data: { sold: { increment: 1 } }
    });
    if (reserved.count === 0) {
      throw new Error('Bu bilet türü için kontenjan kalmadı');
    }

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
        status: 'VALID',
        attendeeName: params.guestName.trim(),
        attendeeEmail: params.guestEmail?.trim() || null
      }
    });

    const createdInvitation = await tx.eventInvitation.create({
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

    return { invitation: createdInvitation };
  });

  const result = mapInvitation(invitation);
  let emailStatus: 'sent' | 'skipped' | 'failed' = 'skipped';
  let emailError: string | undefined;

  if (params.guestEmail && !params.skipEmail) {
    try {
      const emailed = await sendEventInvitationEmail(invitation.id, params.organizerId);
      emailStatus = emailed.status;
      emailError = emailed.error;
    } catch (err) {
      emailStatus = 'failed';
      emailError = err instanceof Error ? err.message : 'E-posta gönderilemedi';
      console.error('[email] invitation', invitation.id, err);
    }
  }

  return { ...result, emailStatus, emailError };
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
