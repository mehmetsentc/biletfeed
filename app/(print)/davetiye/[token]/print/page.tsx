import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { TicketDocument } from '@/components/tickets/design/ticket-document';
import { ticketPrintStyles } from '@/components/tickets/design/ticket-print-styles';
import { PrintPageActions } from '@/components/tickets/print-page-actions';
import { formatTicketDate, formatTicketTime } from '@/lib/tickets/design/format';
import { getPublicInvitation } from '@/lib/services/event-invitations';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitationPrintPage({ params }: Props) {
  const { token } = await params;
  const invitation = await getPublicInvitation(token);
  if (!invitation) notFound();

  const cards =
    invitation.tickets.length > 0
      ? invitation.tickets
      : [
          {
            ticketCode: invitation.ticketCode,
            ticketStatus: invitation.ticketStatus,
            event: invitation.event,
            qrData: invitation.qrData
          }
        ];

  const qrDataUrls = await Promise.all(
    cards.map((ticket) =>
      QRCode.toDataURL(ticket.qrData, {
        width: 320,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      })
    )
  );

  return (
    <>
      <style>{ticketPrintStyles('ticket-print-stack')}</style>
      <style>{`
        @media print {
          .ticket-print-item { page-break-after: always; page-break-inside: avoid; }
          .ticket-print-item:last-child { page-break-after: avoid; }
        }
        @media screen {
          .ticket-print-stack { display: flex; flex-direction: column; gap: 40px; }
        }
      `}</style>
      <PrintPageActions backHref={`/davetiye/${token}`} backLabel="Davetiyeye Dön" />
      <div id="ticket-print-stack" className="ticket-print-stack">
        {cards.map((ticket, index) => (
          <div key={ticket.ticketCode} className="ticket-print-item">
            <TicketDocument
              rootId={`ticket-document-${index}`}
              data={{
                kind: 'invitation',
                brand: 'biletfeed',
                eventTitle: ticket.event.title,
                coverImageUrl: ticket.event.coverImage,
                eventDate: formatTicketDate(ticket.event.startDate),
                eventTime: formatTicketTime(ticket.event.startDate),
                venue: ticket.event.venue,
                city: ticket.event.city,
                ticketTypeName: invitation.ticketTypeName,
                holderName: invitation.guestName,
                ticketCode: ticket.ticketCode,
                qrDataUrl: qrDataUrls[index] ?? '',
                qrData: ticket.qrData,
                status: ticket.ticketStatus,
                personalMessage: index === 0 ? invitation.personalMessage : null
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
}
