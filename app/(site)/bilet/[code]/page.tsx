import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TicketDownloadButton } from '@/components/tickets/ticket-download-button';
import { TicketWebView } from '@/components/tickets/design/ticket-web-view';
import { ticketWebPrintStyles } from '@/components/tickets/design/ticket-print-styles';
import { formatTicketDate, formatTicketTime } from '@/lib/tickets/design/format';
import { getPublicTicketByCode } from '@/lib/services/tickets';
import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';

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
    <div className="relative min-h-screen bg-gradient-to-br from-bf-orange-500 via-bf-orange-400 to-bf-orange-600 px-4 py-8">
      <div
        className="pointer-events-none absolute left-0 top-0 h-32 w-24 opacity-30 sm:h-40 sm:w-32"
        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)', background: '#1A1A1A' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-32 w-24 opacity-20 sm:h-40 sm:w-32"
        style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)', background: '#1A1A1A' }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-lg">
        <div className="no-print mb-6 flex items-center justify-between">
          <Link
            href="/biletlerim"
            className="inline-flex items-center gap-2 rounded-full bg-black/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/25"
          >
            <ArrowLeft className="size-4" />
            Biletlerim
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brandAssetUrl(brandLogos.forDarkSurface)}
            alt="BiletFeed"
            className="h-7 w-auto opacity-90"
          />
        </div>

        <p className="no-print mb-4 text-center text-xs font-semibold uppercase tracking-widest text-white/80">
          Bilet Bilgileri
        </p>

        <TicketWebView
          surface="light"
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
                className="no-print mt-2 flex w-full items-center justify-center rounded-xl py-2.5 text-xs font-medium text-zinc-500 hover:text-primary"
              >
                Yazdır
              </Link>
            </>
          }
        />

        <p className="no-print mt-6 text-center text-xs text-white/70">
          *Türkiye saati (GMT+3) · biletfeed.com
        </p>
      </div>
      <style>{ticketWebPrintStyles()}</style>
    </div>
  );
}
