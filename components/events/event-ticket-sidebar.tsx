'use client';

import Link from 'next/link';
import { ExternalLink, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExternalEventBadge } from '@/components/events/external-event-badge';
import {
  getEventTicketUrl,
  getTicketButtonLabel,
  isExternalListing
} from '@/lib/events/ticket-url';
import { type MockEvent } from '@/lib/data/mock-events';

interface EventTicketSidebarProps {
  event: MockEvent;
  ticketLabel?: string;
}

export function EventTicketSidebar({
  event,
  ticketLabel = 'Standart Bilet'
}: EventTicketSidebarProps) {
  const priceText =
    event.isFree || event.price === 0
      ? 'Ücretsiz'
      : `${event.price.toLocaleString('tr-TR')} ₺'den başlayan`;

  const ticketUrl = getEventTicketUrl(event);
  const external = isExternalListing(event);

  return (
    <aside className="sticky top-24 space-y-6">
      <ExternalEventBadge event={event} />

      <Button
        size="lg"
        className="h-14 w-full gap-2 rounded-lg bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90"
        asChild
      >
        {external ? (
          <a href={ticketUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-5" />
            {getTicketButtonLabel(event)}
          </a>
        ) : (
          <Link href={ticketUrl}>
            <Ticket className="size-5" />
            {getTicketButtonLabel(event)}
          </Link>
        )}
      </Button>

      {external && (
        <p className="text-xs text-muted-foreground">
          Bilet satın alma işlemi ilgili platform sitesinde tamamlanır.
        </p>
      )}

      <div>
        <h2 className="text-lg font-bold">Bilet Bilgileri</h2>
        <div className="mt-4 flex items-start gap-3 text-sm">
          <Ticket className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p>
            <span className="font-medium">{ticketLabel}:</span>{' '}
            <span className="text-muted-foreground">{priceText}</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
