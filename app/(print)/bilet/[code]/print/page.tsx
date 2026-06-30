import { notFound, redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { TicketDocument } from '@/components/tickets/design/ticket-document';
import { ticketPrintStyles } from '@/components/tickets/design/ticket-print-styles';
import { PrintPageActions } from '@/components/tickets/print-page-actions';
import { formatTicketDate, formatTicketTime } from '@/lib/tickets/design/format';
import { getPublicTicketByCode } from '@/lib/services/tickets';

interface Props {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string; id?: string }>;
}

export default async function TicketPrintPage({ params, searchParams }: Props) {
  const { code } = await params;
  const { token = '', id = '' } = await searchParams;

  const ticketCode = decodeURIComponent(code);
  const validationToken = decodeURIComponent(token);
  const ticketId = decodeURIComponent(id);

  if (!validationToken || !ticketId) notFound();

  const ticket = await getPublicTicketByCode(ticketCode, validationToken, ticketId);
  if (!ticket) notFound();

  if (ticket.isInvitation && ticket.inviteToken) {
    redirect(`/davetiye/${ticket.inviteToken}/print`);
  }

  const qrDataUrl = await QRCode.toDataURL(ticket.qrData, {
    width: 320,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const backHref = `/bilet/${encodeURIComponent(ticketCode)}?token=${encodeURIComponent(validationToken)}&id=${encodeURIComponent(ticketId)}`;

  return (
    <>
      <style>{ticketPrintStyles('ticket-document')}</style>
      <PrintPageActions backHref={backHref} backLabel="Bilete Dön" />
      <TicketDocument
        rootId="ticket-document"
        data={{
          kind: 'ticket',
          brand: 'biletfeed',
          eventTitle: ticket.event.title,
          coverImageUrl: ticket.event.coverImage,
          eventDate: formatTicketDate(ticket.event.startDate),
          eventTime: formatTicketTime(ticket.event.startDate),
          venue: ticket.event.venue,
          city: ticket.event.city,
          ticketTypeName: ticket.ticketTypeName,
          holderName: ticket.holderName,
          ticketCode: ticket.ticketCode,
          qrDataUrl,
          qrData: ticket.qrData,
          status: ticket.status
        }}
      />
    </>
  );
}
