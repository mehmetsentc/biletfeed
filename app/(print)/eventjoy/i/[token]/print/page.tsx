import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { TicketDocument } from '@/components/tickets/design/ticket-document';
import { ticketPrintStyles } from '@/components/tickets/design/ticket-print-styles';
import { PrintPageActions } from '@/components/tickets/print-page-actions';
import {
  formatEventJoyDateTime,
  getEventJoyInvitation,
  getEventJoyInviteUrl
} from '@/lib/eventjoy/invitations';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function EventJoyInvitationPrintPage({ params }: Props) {
  const { token } = await params;
  const invitation = await getEventJoyInvitation(token);
  if (!invitation) notFound();

  const inviteUrl = getEventJoyInviteUrl(token);
  const qrDataUrl = await QRCode.toDataURL(inviteUrl, {
    width: 320,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const { dateLabel, timeLabel } = formatEventJoyDateTime(invitation.date, invitation.time);

  return (
    <>
      <style>{ticketPrintStyles('ticket-document')}</style>
      <PrintPageActions backHref={`/eventjoy/i/${token}`} backLabel="Davetiyeye Dön" />
      <TicketDocument
        rootId="ticket-document"
        data={{
          kind: 'invitation',
          brand: 'eventjoy',
          eventTitle: invitation.title,
          coverImageUrl: invitation.coverImage,
          eventDate: dateLabel,
          eventTime: timeLabel,
          venue: invitation.location || 'Belirtilecek',
          city: '',
          ticketTypeName: invitation.type,
          holderName: invitation.hostName,
          ticketCode: token.slice(0, 8).toUpperCase(),
          qrDataUrl,
          status: 'VALID',
          personalMessage: invitation.personalMessage,
          description: invitation.description,
          inviteUrl
        }}
      />
    </>
  );
}
