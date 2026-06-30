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

  const qrDataUrl = await QRCode.toDataURL(invitation.qrData, {
    width: 320,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });

  return (
    <>
      <style>{ticketPrintStyles('ticket-document')}</style>
      <PrintPageActions backHref={`/davetiye/${token}`} backLabel="Davetiyeye Dön" />
      <TicketDocument
        rootId="ticket-document"
        data={{
          kind: 'invitation',
          brand: 'biletfeed',
          eventTitle: invitation.event.title,
          coverImageUrl: invitation.event.coverImage,
          eventDate: formatTicketDate(invitation.event.startDate),
          eventTime: formatTicketTime(invitation.event.startDate),
          venue: invitation.event.venue,
          city: invitation.event.city,
          ticketTypeName: invitation.ticketTypeName,
          holderName: invitation.guestName,
          ticketCode: invitation.ticketCode,
          qrDataUrl,
          qrData: invitation.qrData,
          status: invitation.ticketStatus,
          personalMessage: invitation.personalMessage
        }}
      />
    </>
  );
}
