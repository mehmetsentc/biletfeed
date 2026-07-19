import Link from 'next/link';
import { ArrowRight, CalendarDays, Ticket } from 'lucide-react';
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
  const isEventLinked = Boolean(eventSlug);

  return (
    <section
      className="mt-14 border-t border-border pt-10"
      aria-label={isEventLinked ? 'Etkinlik biletleri' : 'Etkinlik keşfi'}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8">
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--bf-accent-ink)]">
              <CalendarDays className="size-3.5" />
              {isEventLinked ? 'İlgili Etkinlik' : 'Keşfet'}
            </div>
            <p className="text-lg font-bold leading-snug text-foreground sm:text-xl">
              {isEventLinked ? eventTitle : 'Benzer etkinlikleri keşfedin'}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isEventLinked
                ? hasTickets
                  ? 'Biletler sınırlı — hemen yerinizi ayırtın.'
                  : 'Program ve detaylar için etkinlik sayfasına göz atın.'
                : 'Konser, festival ve tiyatro etkinliklerini şehrinize göre filtreleyin.'}
            </p>
          </div>

          <Button asChild size="lg" className="h-12 shrink-0 rounded-xl px-8 font-bold sm:min-w-[200px]">
            <Link
              href={
                isEventLinked
                  ? hasTickets
                    ? `/etkinlik/${eventSlug}`
                    : '/etkinlikler'
                  : '/etkinlikler'
              }
              className="inline-flex items-center justify-center gap-2"
            >
              {isEventLinked && hasTickets ? (
                <>
                  <Ticket className="size-4" />
                  Bilet Al
                </>
              ) : (
                <>
                  Etkinlikleri Gör
                  <ArrowRight className="size-4" />
                </>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
