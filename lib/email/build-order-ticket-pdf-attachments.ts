import {
  formatTurkeyDateLong,
  formatTurkeyTime
} from '@/lib/datetime/istanbul';
import {
  buildTicketPdfFilename,
  generateTicketPdf
} from '@/lib/tickets/pdf/generate-ticket-pdf';
import { buildTicketQrPayload } from '@/lib/tickets/sign';

type TicketEventContext = {
  title: string;
  coverImage: string | null;
  startDate: Date;
  isOnline: boolean;
  onlineUrl: string | null;
  venue: { name: string; address: string | null } | null;
  city: { name: string } | null;
};

type OrderTicketPdfContext = {
  event: TicketEventContext;
  holderFallback: string;
  tickets: Array<{
    id: string;
    ticketCode: string;
    validationToken: string;
    status: string;
    attendeeName: string | null;
    ticketType: { name: string };
    event?: TicketEventContext;
  }>;
};

function eventVenueCity(event: TicketEventContext): { venueName: string; cityName: string } {
  return {
    venueName: event.isOnline
      ? 'Online Etkinlik'
      : event.venue?.name ?? 'Mekan bilgisi yakında',
    cityName: event.city?.name ?? ''
  };
}

export async function buildOrderTicketPdfAttachments(
  ctx: OrderTicketPdfContext
): Promise<Array<{ filename: string; content: Buffer }>> {
  return Promise.all(
    ctx.tickets.map(async (ticket) => {
      const event = ticket.event ?? ctx.event;
      const { venueName, cityName } = eventVenueCity(event);
      const qrData = buildTicketQrPayload({
        ticketId: ticket.id,
        ticketCode: ticket.ticketCode,
        validationToken: ticket.validationToken
      });

      const buffer = await generateTicketPdf({
        kind: 'ticket',
        eventTitle: event.title,
        coverImageUrl: event.coverImage,
        eventDate: formatTurkeyDateLong(event.startDate),
        eventTime: formatTurkeyTime(event.startDate),
        venue: venueName,
        city: cityName,
        ticketTypeName: ticket.ticketType.name,
        holderName: ticket.attendeeName?.trim() || ctx.holderFallback || 'Misafir',
        ticketCode: ticket.ticketCode,
        qrData,
        status: ticket.status
      });

      return {
        filename: buildTicketPdfFilename(event.title, ticket.ticketCode),
        content: buffer
      };
    })
  );
}
