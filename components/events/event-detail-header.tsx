import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Clock3, MapPin, Tag } from 'lucide-react';
import {
  formatEventDateLong,
  type MockEvent
} from '@/lib/data/mock-events';
import { formatEventTimeDisplay } from '@/lib/datetime/istanbul';
import { getEventPlatformTheme } from '@/lib/events/platform-theme';
import { isExternalListing } from '@/lib/events/ticket-url';
import { getServerTranslations } from '@/lib/i18n/server';
import { EventDetailActions } from '@/components/events/event-detail-actions';
import { EventPurchaseCard } from '@/components/events/event-purchase-card';
import { cn } from '@/lib/utils';

interface EventDetailHeaderProps {
  event: MockEvent;
  eventUrl: string;
  isFavorite: boolean;
  isOnline: boolean;
  purchasable: boolean;
}

export async function EventDetailHeader({
  event,
  eventUrl,
  isFavorite,
  isOnline,
  purchasable
}: EventDetailHeaderProps) {
  const { t } = await getServerTranslations();
  const theme = getEventPlatformTheme(event);
  const external = isExternalListing(event);
  const locationLine = isOnline
    ? t.events.onlineEvent
    : [event.venue, event.city].filter(Boolean).join(', ');

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      style={
        {
          '--event-accent': theme.accent,
          '--event-accent-foreground': theme.accentForeground,
          '--event-accent-soft': theme.accentSoft
        } as React.CSSProperties
      }
    >
      <div className="grid gap-0 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr_300px]">
        <div className="relative aspect-[4/5] w-full bg-muted md:aspect-auto md:min-h-[320px]">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 260px"
          />
        </div>

        <div className="flex flex-col justify-between gap-5 p-5 md:p-6 lg:pr-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                    style={{ backgroundColor: theme.accent, color: theme.accentForeground }}
                  >
                    {theme.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    <Tag className="size-3" />
                    {event.category}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
                  {event.title}
                </h1>
                {event.shortDescription &&
                  event.shortDescription.trim() !== event.title.trim() && (
                    <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                      {event.shortDescription}
                    </p>
                  )}
              </div>
              <EventDetailActions
                title={event.title}
                shareUrl={eventUrl}
                eventId={event.id}
                initialFavorite={isFavorite}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow
                icon={CalendarDays}
                label={t.events.date}
                value={formatEventDateLong(event.startDate)}
              />
              <InfoRow
                icon={Clock3}
                label={t.events.time}
                value={formatEventTimeDisplay(event.startDate, event.endDate)}
              />
              <InfoRow
                icon={MapPin}
                label={t.events.venue}
                value={locationLine}
                className="sm:col-span-2"
              />
            </div>
          </div>

          {external && event.externalUrl && (
            <p className="text-xs text-muted-foreground">
              {t.events.externalCheckoutPrefix}{' '}
              <Link
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {theme.label}
              </Link>{' '}
              {t.events.externalCheckoutSuffix}
            </p>
          )}
        </div>

        <div className="hidden border-t border-border p-5 md:col-span-2 md:block lg:col-span-1 lg:border-l lg:border-t-0">
          <EventPurchaseCard
            event={event}
            purchasable={purchasable}
            variant="embedded"
            className="lg:sticky lg:top-24"
          />
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-3',
        className
      )}
    >
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: 'var(--event-accent)',
          color: 'var(--event-accent-foreground)'
        }}
      >
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}
