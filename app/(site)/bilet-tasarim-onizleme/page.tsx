import { notFound } from 'next/navigation';
import { TicketDesignPreview } from '@/components/tickets/ticket-design-preview';
import { ticketHeaderLogoSrc } from '@/lib/brand/embed-logo';
import { buildInvitationEmail } from '@/lib/email/invitation-template';
import { buildTicketPurchaseEmail } from '@/lib/email/ticket-purchase-template';
import { qrToDataUrl } from '@/lib/tickets/design/qr-data-url';

const MOCK = {
  eventTitle: 'MANIFEST',
  eventDate: 'Cuma, 30 Mayıs 2026',
  eventTime: '21:00',
  venue: 'Dido Beach (5 Nolu Lara Plajı)',
  city: 'Antalya',
  ticketTypeName: 'Genel Giriş Ayakta',
  holderName: 'Ahmet Yılmaz',
  ticketCode: 'BF-77720559',
  orderNumber: '344328',
  categoryLabel: 'Genel Giriş',
  sectorGate: 'Genel Giriş / Genel_Giris',
  personalMessage: 'Seni aramızda görmekten mutluluk duyarız!',
  inviteUrl: 'https://biletfeed.com/davetiye/ornek-token'
} as const;

export const metadata = {
  title: 'Bilet Tasarım Önizleme — BiletFeed',
  robots: { index: false, follow: false }
};

export default async function TicketDesignPreviewPage() {
  if (process.env.NODE_ENV === 'production' && process.env.TICKET_PREVIEW_ENABLED !== 'true') {
    notFound();
  }

  const qrInvite = await qrToDataUrl(MOCK.inviteUrl);
  const qrTicket = await qrToDataUrl(
    `https://biletfeed.com/bilet/${MOCK.ticketCode}?token=preview&id=preview`
  );

  const invitationEmailHtml = buildInvitationEmail({
    guestName: MOCK.holderName,
    eventTitle: MOCK.eventTitle,
    eventDate: MOCK.eventDate,
    eventTime: MOCK.eventTime,
    eventVenue: MOCK.venue,
    eventCity: MOCK.city,
    coverImage: '',
    ticketTypeName: MOCK.ticketTypeName,
    ticketCode: MOCK.ticketCode,
    qrDataUrl: qrInvite,
    personalMessage: MOCK.personalMessage,
    inviteUrl: MOCK.inviteUrl,
    organizerName: 'Let Us Event',
    categoryLabel: MOCK.categoryLabel,
    sectorGate: MOCK.sectorGate
  });

  const purchaseEmailHtml = buildTicketPurchaseEmail({
    customerName: MOCK.holderName,
    eventTitle: MOCK.eventTitle,
    eventDate: MOCK.eventDate,
    eventTime: MOCK.eventTime,
    eventVenue: MOCK.venue,
    eventCity: MOCK.city,
    coverImage: '',
    organizerName: 'Let Us Event',
    orderNumber: MOCK.orderNumber,
    totalLabel: '₺450,00',
    ticketLines: [{ name: MOCK.ticketTypeName, quantity: 1, unitPrice: '₺450,00' }],
    ticketCodes: [MOCK.ticketCode],
    qrDataUrl: qrTicket,
    ticketsUrl: 'https://biletfeed.com/biletlerim',
    eventUrl: 'https://biletfeed.com/etkinlik/manifest',
    printUrl: 'https://biletfeed.com/api/tickets/pdf'
  });

  const logoSrc = ticketHeaderLogoSrc();

  return (
    <TicketDesignPreview
      mock={MOCK}
      logoSrc={logoSrc}
      qrInvite={qrInvite}
      qrTicket={qrTicket}
      invitationEmailHtml={invitationEmailHtml}
      purchaseEmailHtml={purchaseEmailHtml}
    />
  );
}
