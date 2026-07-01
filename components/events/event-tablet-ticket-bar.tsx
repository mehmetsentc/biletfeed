import Link from 'next/link';
import { ExternalLink, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getEventTicketUrl,
  getTicketButtonLabel,
  isExternalListing
} from '@/lib/events/ticket-url';
import { type MockEvent } from '@/lib/data/mock-events';

interface EventTabletTicketBarProps {
  event: MockEvent;
  purchasable?: boolean;
}

export function EventTabletTicketBar({
  event,
  purchasable = true
}: EventTabletTicketBarProps) {
  const external = isExternalListing(event);
  const ticketUrl = getEventTicketUrl(event);

  const priceText =
    event.isFree || event.price === 0
      ? 'Ücretsiz'
      : `${event.price.toLocaleString('tr-TR')} ₺`;

  return (
    <div className="hidden items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 md:flex lg:hidden">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Bilet fiyatı</p>
        <p className="text-2xl font-bold">{priceText}</p>
      </div>
      {purchasable ? (
        <Button
          size="lg"
          className="h-12 gap-2 rounded-xl px-8 text-base font-bold"
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
              Bilet Al
            </Link>
          )}
        </Button>
      ) : (
        <Button size="lg" disabled className="h-12 rounded-xl px-8 text-base font-bold">
          Satış kapalı
        </Button>
      )}
    </div>
  );
}
