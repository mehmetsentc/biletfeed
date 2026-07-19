import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { CategoryBadge } from '@/components/events/category-badge';
import {
  formatEventDate,
  formatEventTimeRange,
  formatEventMonthDay,
  type MockEvent
} from '@/lib/data/mock-events';
import {
  getEventTicketUrl,
  getExternalPlatformLabel,
  getTicketButtonShortLabel,
  isExternalListing
} from '@/lib/events/ticket-url';
import { cn } from '@/lib/utils';

export function NahaberEventCard({ event }: { event: MockEvent }) {
  const { day, month } = formatEventMonthDay(event.startDate);
  const ticketUrl = getEventTicketUrl(event);
  const external = isExternalListing(event);
  const platformLabel = getExternalPlatformLabel(event.externalPlatform);
  const locationLine = `${event.venue} – ${event.city}`;

  return (
    <article className="card-premium overflow-hidden rounded-[var(--radius-card)] border border-border/70 bg-card shadow-[var(--shadow-card)] transition hover:border-primary/35 hover:shadow-[var(--shadow-card-hover)]">
      <Link
        href={`/etkinlik/${event.slug}`}
        className="group relative block aspect-[16/9] overflow-hidden"
      >
        <Image
          src={event.coverImage}
          alt={event.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 event-image-overlay-subtle" />

        <div className="absolute left-2.5 top-2.5 min-w-[3rem] rounded-md border border-white/20 bg-black/75 px-2 py-1 text-center shadow-[0_2px_10px_rgba(0,0,0,0.4)] backdrop-blur-sm">
          <div className="text-lg font-bold leading-none text-white">{day}</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/85">
            {month}
          </div>
        </div>

        <CategoryBadge
          slug={event.categorySlug}
          label={event.category}
          variant="overlay"
          className="absolute right-2.5 top-2.5"
        />

        {(platformLabel || !external) && (
          <span className="absolute bottom-2.5 left-2.5 rounded-md border border-white/25 bg-white/95 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a] shadow-sm">
            {platformLabel ?? 'Bilet Feed'}
          </span>
        )}
      </Link>

      <div className="p-3 md:p-4">
        <p className="truncate text-xs text-muted-foreground">{locationLine}</p>

        <Link href={`/etkinlik/${event.slug}`}>
          <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-foreground transition hover:text-[var(--bf-accent-ink)]">
            {event.title}
          </h3>
        </Link>

        <p className="mt-1 text-xs text-muted-foreground">
          {formatEventDate(event.startDate)}, {formatEventTimeRange(event)}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="shrink-0 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {event.city}
          </span>

          {external ? (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition',
                'bg-primary text-primary-foreground ring-2 ring-card hover:bg-[var(--bf-orange-hover)]'
              )}
            >
              {getTicketButtonShortLabel(event)}
              <ExternalLink className="size-3 opacity-80" />
            </a>
          ) : (
            <Link
              href={ticketUrl}
              className={cn(
                'inline-flex shrink-0 items-center rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition',
                'bg-primary text-primary-foreground ring-2 ring-card hover:bg-[var(--bf-orange-hover)]'
              )}
            >
              {getTicketButtonShortLabel(event)}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
