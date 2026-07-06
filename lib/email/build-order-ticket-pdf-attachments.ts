import {
  formatTurkeyDateLong,
  formatTurkeyTime
} from '@/lib/datetime/istanbul';
import {
  buildTicketPdfFilename,
  generateTicketPdf
} from '@/lib/tickets/pdf/generate-ticket-pdf';
import { buildTicketQrPayload } from '@/lib/tickets/sign';

type OrderTicketPdfContext = {
  event: {
    title: string;
    coverImage: string | null;
    startDate: Date;
    isOnline: boolean;
    onlineUrl: string | null;
    venue: { name: string; address: string | null } | null;
    city: { name: string } | null;
  };
  holderFallback: string;
  tickets: Array<{
    id: string;
    ticketCode: string;
    validationToken: string;
    status: string;
    attendeeName: string | null;
    ticketType: { name: string };
  }>;
};

export async function buildOrderTicketPdfAttachments(
  ctx: OrderTicketPdfContext
): Promise<Array<{ filename: string; content: Buffer }>> {
  const venueName = ctx.event.isOnline
    ? 'Online Etkinlik'
    : ctx.event.venue?.name ?? 'Mekan bilgisi yakında';
  const cityName = ctx.event.city?.name ?? '';
  const eventDate = formatTurkeyDateLong(ctx.event.startDate);
  const eventTime = formatTurkeyTime(ctx.event.startDate);

  return Promise.all(
    ctx.tickets.map(async (ticket) => {
      const qrData = buildTicketQrPayload({
        ticketId: ticket.id,
        ticketCode: ticket.ticketCode,
        validationToken: ticket.validationToken
      });

      const buffer = await generateTicketPdf({
        kind: 'ticket',
        eventTitle: ctx.event.title,
        coverImageUrl: ctx.event.coverImage,
        eventDate,
        eventTime,
        venue: venueName,
        city: cityName,
        ticketTypeName: ticket.ticketType.name,
        holderName: ticket.attendeeName?.trim() || ctx.holderFallback || 'Misafir',
        ticketCode: ticket.ticketCode,
        qrData,
        status: ticket.status
      });

      return {
        filename: buildTicketPdfFilename(ctx.event.title, ticket.ticketCode),
        content: buffer
      };
    })
  );
}
