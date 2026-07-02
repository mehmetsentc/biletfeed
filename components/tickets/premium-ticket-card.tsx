'use client';

import { TicketWebView } from '@/components/tickets/design/ticket-web-view';

export interface PremiumTicketCardProps {
  eventTitle: string;
  eventImage: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  city: string;
  ticketType: string;
  holderName: string;
  ticketCode: string;
  qrData: string;
  status: string;
  priceLabel?: string;
  eventSlug?: string;
  variant?: 'dark' | 'light';
  className?: string;
  id?: string;
}

/** Hesap bilet detayı — birleşik BiletFeed bilet tasarım sistemi */
export function PremiumTicketCard({
  eventTitle,
  eventImage,
  eventDate,
  eventTime,
  venue,
  city,
  ticketType,
  holderName,
  ticketCode,
  qrData,
  status,
  priceLabel,
  eventSlug,
  className,
  id
}: PremiumTicketCardProps) {
  return (
    <div id={id} className={className}>
      <TicketWebView
        data={{
          kind: 'ticket',
          brand: 'biletfeed',
          eventTitle,
          coverImageUrl: eventImage,
          eventDate,
          eventTime,
          venue,
          city,
          ticketTypeName: ticketType,
          holderName,
          ticketCode,
          qrDataUrl: '',
          qrData,
          status,
          priceLabel: priceLabel ?? null
        }}
        ctaHref={eventSlug ? `/etkinlik/${eventSlug}` : undefined}
      />
    </div>
  );
}
