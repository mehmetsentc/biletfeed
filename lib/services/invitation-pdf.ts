import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { buildTicketQrPayload } from '@/lib/tickets/sign';
import { getSiteUrl } from '@/lib/config/domain';
import {
  buildTicketPdfFilename,
  generateTicketPdf
} from '@/lib/tickets/pdf/generate-ticket-pdf';
import { mapInvitationToPdf } from '@/lib/tickets/pdf/map-ticket-data';

export async function getOrganizerInvitationPdfInput(
  invitationId: string,
  organizerId: string
) {
  await ensureDbConnection();
  const row = await prisma.eventInvitation.findFirst({
    where: { id: invitationId, organizerId, deletedAt: null },
    include: {
      purchasedTicket: {
        select: { id: true, ticketCode: true, validationToken: true, status: true }
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

  const qrData = buildTicketQrPayload({
    ticketId: row.purchasedTicket.id,
    ticketCode: row.purchasedTicket.ticketCode,
    validationToken: row.purchasedTicket.validationToken
  });

  return {
    invitation: row,
    pdfInput: mapInvitationToPdf({
      guestName: row.guestName,
      personalMessage: row.personalMessage,
      ticketCode: row.purchasedTicket.ticketCode,
      ticketStatus: row.purchasedTicket.status,
      ticketTypeName: row.ticketType.name,
      event: {
        title: row.event.title,
        coverImage: row.event.coverImage ?? '',
        startDate: row.event.startDate.toISOString(),
        venue: row.event.venue?.name ?? 'Online',
        city: row.event.city.name
      },
      qrData
    }),
    inviteUrl: getSiteUrl(`/davetiye/${row.inviteToken}`),
    filename: buildTicketPdfFilename(row.event.title, row.purchasedTicket.ticketCode)
  };
}

export async function generateOrganizerInvitationPdf(
  invitationId: string,
  organizerId: string
): Promise<{ buffer: Buffer; filename: string } | null> {
  const data = await getOrganizerInvitationPdfInput(invitationId, organizerId);
  if (!data) return null;
  const buffer = await generateTicketPdf(data.pdfInput);
  return { buffer, filename: data.filename };
}
