import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TicketDownloadButton } from '@/components/tickets/ticket-download-button';
import { TicketWebView } from '@/components/tickets/design/ticket-web-view';
import { ticketWebPrintStyles } from '@/components/tickets/design/ticket-print-styles';
import { formatTicketDate, formatTicketTime } from '@/lib/tickets/design/format';
import { getPublicTicketByCode } from '@/lib/services/tickets';

interface Props {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string; id?: string }>;
}

export default async function PublicTicketPage({ params, searchParams }: Props) {
  const { code } = await params;
  const { token = '', id = '' } = await searchParams;

  const ticketCode = decodeURIComponent(code);
  const validationToken = decodeURIComponent(token);
  const ticketId = decodeURIComponent(id);

  if (!validationToken || !ticketId) notFound();

  const ticket = await getPublicTicketByCode(ticketCode, validationToken, ticketId);
  if (!ticket) notFound();

  if (ticket.isInvitation && ticket.inviteToken) {
    const { redirect } = await import('next/navigation');
    redirect(`/davetiye/${ticket.inviteToken}`);
  }

  return (
    <div className="min-h-screen bg-[#0c1017] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <TicketWebView
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
            qrDataUrl: '',
            qrData: ticket.qrData,
            status: ticket.status
          }}
          ctaHref={`/etkinlik/${ticket.event.slug}`}
          footer={
            <>
              <TicketDownloadButton
                ticketCode={ticket.ticketCode}
                ticketId={ticketId}
                validationToken={validationToken}
              />
              <Link
                href={`/bilet/${encodeURIComponent(ticketCode)}/print?token=${encodeURIComponent(validationToken)}&id=${encodeURIComponent(ticketId)}`}
                target="_blank"
                className="no-print mt-2 flex w-full items-center justify-center rounded-xl py-2.5 text-xs font-medium text-white/45 hover:text-white/70"
              >
                Yazdır
              </Link>
            </>
          }
        />

        <p className="mt-6 text-center text-xs text-white/30 no-print">biletfeed.com · Güvenli bilet sistemi</p>
      </div>
      <style>{ticketWebPrintStyles()}</style>
    </div>
  );
}
