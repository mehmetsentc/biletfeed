import Image from 'next/image';
import Link from 'next/link';
import { Tag } from 'lucide-react';
import { FavoriteButton } from '@/components/events/favorite-button';
import {
  type MockEvent,
  formatEventDateLine,
  formatEventTimeRange,
  formatPrice
} from '@/lib/data/mock-events';
import { cn } from '@/lib/utils';

interface EventifyHorizontalCardProps {
  event: MockEvent;
  className?: string;
}

export function EventifyHorizontalCard({
  event,
  className
}: EventifyHorizontalCardProps) {
  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md',
        className
      )}
    >
      {/* Favori butonu Link'in DIŞINDA */}
      <FavoriteButton
        className="absolute right-3 top-3 z-20 !bg-card/90 !text-foreground shadow-md hover:!bg-card"
        icon="star"
        eventId={event.id}
      />
      <Link
        href={`/etkinlik/${event.slug}`}
        className="flex flex-col sm:flex-row"
      >
        <div className="relative aspect-video w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-[220px] md:w-[260px]">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width:640px) 100vw, 260px"
          />
          <span className="absolute bottom-3 left-3 rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
            {event.category}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
          <h3 className="line-clamp-2 text-base font-bold leading-snug group-hover:text-[var(--bf-accent-ink)] md:text-lg">
            {event.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatEventDateLine(event)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatEventTimeRange(event)}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Tag className="size-3.5 shrink-0 text-[var(--bf-accent-ink)]/80" aria-hidden />
            {formatPrice(event)}
          </p>
        </div>
      </Link>
    </article>
  );
}
