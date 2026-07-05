import Image from 'next/image';
import Link from 'next/link';
import { Star, Tag } from 'lucide-react';
import { FavoriteButton } from '@/components/events/favorite-button';
import { CategoryBadge } from '@/components/events/category-badge';
import { SourceBadge } from '@/components/events/source-badge';
import {
  type MockEvent,
  formatEventMonthDay,
  formatEventTimeRange,
  formatPrice
} from '@/lib/data/mock-events';
import { cn } from '@/lib/utils';

interface EventifyCardProps {
  event: MockEvent;
  countryBadge?: string;
  className?: string;
  isFavorite?: boolean;
}

export function EventifyCard({
  event,
  countryBadge,
  className,
  isFavorite = false
}: EventifyCardProps) {
  const { month, day } = formatEventMonthDay(event.startDate);
  const interested = event.favoriteCount ?? 0;

  return (
    <article
      className={cn(
        'card-premium group relative overflow-hidden rounded-[var(--radius-card)] border border-border/80 bg-card',
        className
      )}
    >
      <FavoriteButton
        className="absolute right-3 top-3 z-20 !bg-card/90 !text-foreground shadow-[var(--shadow-sm)] backdrop-blur-sm transition-transform duration-200 hover:!bg-card hover:scale-105"
        icon="star"
        eventId={event.id}
        initialActive={isFavorite}
      />
      <Link href={`/etkinlik/${event.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-[var(--radius-image)]">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
            sizes="(max-width:768px) 100vw, 33vw"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          {countryBadge && (
            <span className="absolute left-3 top-3 z-10">
              <SourceBadge label={countryBadge} />
            </span>
          )}
          <span className="absolute bottom-3 left-3 z-10">
            <CategoryBadge
              slug={event.categorySlug}
              label={event.category}
              variant="overlay"
            />
          </span>
        </div>

        <div className="flex gap-4 p-4 md:p-5">
          <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/30 px-2 py-2.5 text-center backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {month}
            </span>
            <span className="text-2xl font-extrabold leading-none text-foreground">{day}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">
              {event.title}
            </h3>
            <p className="mt-1 truncate text-sm font-medium text-muted-foreground">
              {event.isOnline || event.citySlug === 'online'
                ? 'Online'
                : `${event.venue}, ${event.city}`}
            </p>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground/90">
              {formatEventTimeRange(event)}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Tag className="size-3 shrink-0 text-primary/80" aria-hidden />
                {formatPrice(event)}
              </span>
              {interested > 0 && (
                <span className="inline-flex items-center gap-1 text-primary/80">
                  <Star className="size-3" />
                  {interested} ilgi
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
