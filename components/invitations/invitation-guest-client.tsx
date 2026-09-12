'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { TicketWebView } from '@/components/tickets/design/ticket-web-view';
import { ticketWebPrintStyles } from '@/components/tickets/design/ticket-print-styles';
import { formatTicketDate, formatTicketTime } from '@/lib/tickets/design/format';

type InvitationTicketCard = {
  ticketCode: string;
  ticketStatus: string;
  event: {
    title: string;
    coverImage: string;
    startDate: string;
    venue: string;
    city: string;
    slug: string;
  };
  qrData: string;
};

type InvitationData = {
  guestName: string;
  personalMessage: string | null;
  ticketCode: string;
  ticketStatus: string;
  ticketTypeName: string;
  inviteToken?: string;
  event: InvitationTicketCard['event'];
  qrData: string;
  inviteUrl: string;
  tickets?: InvitationTicketCard[];
};

export function InvitationGuestClient({
  invitation,
  inviteToken
}: {
  invitation: InvitationData;
  inviteToken: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const cards: InvitationTicketCard[] =
    invitation.tickets && invitation.tickets.length > 0
      ? invitation.tickets
      : [
          {
            ticketCode: invitation.ticketCode,
            ticketStatus: invitation.ticketStatus,
            event: invitation.event,
            qrData: invitation.qrData
          }
        ];
  const multi = cards.length > 1;

  return (
    <div className="min-h-screen bg-[#0c1017] px-4 py-10">
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        {cards.map((ticket, index) => (
          <TicketWebView
            key={ticket.ticketCode}
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
              qrDataUrl: '',
              qrData: ticket.qrData,
              status: ticket.ticketStatus,
              personalMessage: index === 0 ? invitation.personalMessage : null
            }}
            ctaHref={`/etkinlik/${ticket.event.slug}`}
            footer={
              index === cards.length - 1 ? (
                <>
                  <button
                    type="button"
                    disabled={downloading}
                    onClick={async () => {
                      setDownloading(true);
                      try {
                        const res = await fetch(
                          `/api/invitations/${encodeURIComponent(inviteToken)}/pdf`
                        );
                        if (!res.ok) throw new Error('PDF indirilemedi');
                        const blob = await res.blob();
                        const objectUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = objectUrl;
                        link.download =
                          res.headers
                            .get('Content-Disposition')
                            ?.match(/filename="([^"]+)"/)?.[1] ??
                          `BiletFeed-${invitation.ticketCode}.pdf`;
                        link.click();
                        URL.revokeObjectURL(objectUrl);
                      } catch {
                        window.alert('Davetiye PDF indirilemedi. Lütfen tekrar deneyin.');
                      } finally {
                        setDownloading(false);
                      }
                    }}
                    className="no-print mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] py-3 text-sm font-medium text-white/55 transition-opacity hover:opacity-80 disabled:opacity-60"
                  >
                    <Download className="size-4" />
                    {downloading
                      ? 'İndiriliyor…'
                      : multi
                        ? 'Davetiyeleri İndir (PDF)'
                        : 'Davetiye İndir (PDF)'}
                  </button>
                  <Link
                    href={`/davetiye/${inviteToken}/print`}
                    target="_blank"
                    className="no-print mt-2 flex w-full items-center justify-center rounded-xl py-2.5 text-xs font-medium text-white/45 hover:text-white/70"
                  >
                    Yazdır
                  </Link>
                </>
              ) : null
            }
          />
        ))}

        <p className="mt-2 text-center text-xs text-white/20 no-print">
          biletfeed.com · Güvenli etkinlik ve bilet platformu
        </p>
      </div>
      <style>{ticketWebPrintStyles()}</style>
    </div>
  );
}
