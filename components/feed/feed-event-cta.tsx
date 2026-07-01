import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FeedEventCta({
  eventSlug,
  eventTitle,
  hasTickets
}: {
  eventSlug: string | null;
  eventTitle: string | null;
  hasTickets: boolean;
}) {
  if (!eventSlug) {
    return (
      <div className="sticky bottom-4 z-20 mx-auto max-w-lg rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-lg backdrop-blur">
        <p className="text-sm font-semibold text-foreground">Benzer etkinlikleri keşfedin</p>
        <Button asChild className="mt-3 w-full">
          <Link href="/etkinlikler">Etkinlikleri Gör</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="sticky bottom-4 z-20 mx-auto max-w-lg rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-lg backdrop-blur">
      <p className="truncate text-sm font-semibold text-foreground">{eventTitle}</p>
      <Button asChild className="mt-3 w-full gap-2">
        <Link href={hasTickets ? `/etkinlik/${eventSlug}` : '/etkinlikler'}>
          <Ticket className="size-4" />
          {hasTickets ? 'Bilet Al' : 'Benzer Etkinlikleri Keşfet'}
        </Link>
      </Button>
    </div>
  );
}
