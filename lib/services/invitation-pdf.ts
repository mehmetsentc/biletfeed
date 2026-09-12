import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { buildTicketQrPayload } from '@/lib/tickets/sign';
import { getSiteUrl } from '@/lib/config/domain';
import {
  buildTicketPdfFilename,
  generateTicketPdf
} from '@/lib/tickets/pdf/generate-ticket-pdf';
import { mapInvitationToPdf } from '@/lib/tickets/pdf/map-ticket-data';

const invitationTicketSelect = {
  id: true,
  ticketCode: true,
  validationToken: true,
  status: true,
  seatUnitId: true,
  event: {
    select: {
      title: true,
      coverImage: true,
      startDate: true,
      venue: { select: { name: true } },
      city: { select: { name: true } }
    }
  }
} as const;

async function loadInvitationPdfTickets(invitationId: string, organizerId: string) {
  const row = await prisma.eventInvitation.findFirst({
    where: { id: invitationId, organizerId, deletedAt: null },
    include: {
      purchasedTicket: {
        select: {
          id: true,
          ticketCode: true,
          validationToken: true,
          status: true,
          seatUnitId: true,
          orderId: true
        }
      },
      ticketType: { select: { name: true } },
      event: {
        select: {
          title: true,
          coverImage: true,
          startDate: true,
          venue: { select: { name: true } },
          city: { select: { name: true } }
        }
      }
    }
  });

  if (!row) return null;

  const siblings = await prisma.purchasedTicket.findMany({
    where: {
      orderId: row.purchasedTicket.orderId,
      deletedAt: null,
      status: { notIn: ['CANCELLED', 'REFUNDED'] }
    },
    select: invitationTicketSelect,
    orderBy: { event: { startDate: 'asc' } }
  });

  const tickets =
    siblings.length > 0
      ? siblings
      : [
          {
            id: row.purchasedTicket.id,
            ticketCode: row.purchasedTicket.ticketCode,
            validationToken: row.purchasedTicket.validationToken,
            status: row.purchasedTicket.status,
            seatUnitId: row.purchasedTicket.seatUnitId,
            event: row.event
          }
        ];

  return { row, tickets };
}

export async function getOrganizerInvitationPdfInput(
  invitationId: string,
  organizerId: string
) {
  const files = await getOrganizerInvitationPdfInputs(invitationId, organizerId);
  return files[0] ?? null;
}

export async function getOrganizerInvitationPdfInputs(
  invitationId: string,
  organizerId: string
) {
  await ensureDbConnection();
  const loaded = await loadInvitationPdfTickets(invitationId, organizerId);
  if (!loaded) return [];

  const { row, tickets } = loaded;

  return tickets.map((ticket) => {
    const qrData = buildTicketQrPayload({
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      validationToken: ticket.validationToken
    });

    return {
      invitation: row,
      pdfInput: mapInvitationToPdf({
        guestName: row.guestName,
        personalMessage: row.personalMessage,
        ticketCode: ticket.ticketCode,
        ticketStatus: ticket.status,
        ticketTypeName: row.ticketType.name,
        seatUnitId: ticket.seatUnitId,
        event: {
          title: ticket.event.title,
          coverImage: ticket.event.coverImage ?? '',
          startDate: ticket.event.startDate.toISOString(),
          venue: ticket.event.venue?.name ?? 'Online',
          city: ticket.event.city.name
        },
        qrData
      }),
      inviteUrl: getSiteUrl(`/davetiye/${row.inviteToken}`),
      filename: buildTicketPdfFilename(ticket.event.title, ticket.ticketCode),
      eventTitle: ticket.event.title
    };
  });
}

export async function generateOrganizerInvitationPdf(
  invitationId: string,
  organizerId: string
): Promise<{ buffer: Buffer; filename: string; eventTitle: string } | null> {
  const files = await generateOrganizerInvitationPdfs(invitationId, organizerId);
  return files[0] ?? null;
}

export async function generateOrganizerInvitationPdfs(
  invitationId: string,
  organizerId: string
): Promise<Array<{ buffer: Buffer; filename: string; eventTitle: string }>> {
  const inputs = await getOrganizerInvitationPdfInputs(invitationId, organizerId);
  return Promise.all(
    inputs.map(async (data) => ({
      buffer: await generateTicketPdf(data.pdfInput),
      filename: data.filename,
      eventTitle: data.eventTitle
    }))
  );
}
