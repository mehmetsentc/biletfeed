'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/shared/safe-image';
import { MapPin, Mic2, Users } from 'lucide-react';
import { AccountProfileTabs } from '@/components/account/account-profile-tabs';
import { EventifyCard } from '@/components/events/eventify-card';
import type { MockEvent } from '@/lib/data/mock-events';
import type { MockOrganizer } from '@/lib/data/mock-organizers';
import type { FavoriteVenue } from '@/lib/services/favorites';
import { cn } from '@/lib/utils';

type FavoriteTab = 'events' | 'artists' | 'venues';

const tabs: { id: FavoriteTab; label: string }[] = [
  { id: 'events', label: 'Etkinlikler' },
  { id: 'artists', label: 'Sanatçılar' },
  { id: 'venues', label: 'Mekanlar' }
];

const emptyCopy: Record<
  FavoriteTab,
  { title: string; description: string; cta?: { href: string; label: string } }
> = {
  events: {
    title: 'Henüz favori etkinlik bulunamadı',
    description:
      'Etkinliklere göz atıp beğendiklerini favorilerine ekleyebilirsin.',
    cta: { href: '/etkinlikler', label: 'Etkinliklere Göz At' }
  },
  artists: {
    title: 'Henüz favori sanatçı bulunamadı',
    description:
      'Beğendiğin sanatçıları takip ederek burada görebilirsin.',
    cta: { href: '/organizatorler', label: 'Sanatçıları Keşfet' }
  },
  venues: {
    title: 'Henüz favori mekan bulunamadı',
    description: 'Beğendiğin mekanları favorilerine ekleyebilirsin.',
    cta: { href: '/mekanlar', label: 'Mekanlara Göz At' }
  }
};

function OrganizerCard({ organizer }: { organizer: MockOrganizer }) {
  return (
    <Link
      href={`/organizator/${organizer.slug}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted">
        {organizer.logo ? (
          <SafeImage
            src={organizer.logo}
            alt={organizer.name}
            fill
            className="object-cover"
            fallback={
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <Mic2 className="size-6" strokeWidth={1.75} />
              </div>
            }
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Mic2 className="size-6" strokeWidth={1.75} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{organizer.name}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {organizer.description}
        </p>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3" />
          {organizer.followerCount.toLocaleString('tr-TR')} takipçi
        </p>
      </div>
    </Link>
  );
}

function VenueCard({ venue }: { venue: FavoriteVenue }) {
  return (
    <Link
      href={`/mekanlar/${venue.slug}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {venue.image ? (
          <SafeImage
            src={venue.image}
            alt={venue.name}
            fill
            className="object-cover"
            fallback={
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <MapPin className="size-6" strokeWidth={1.75} />
              </div>
            }
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <MapPin className="size-6" strokeWidth={1.75} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{venue.name}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />
          {venue.city}
        </p>
      </div>
    </Link>
  );
}

export function MyFavoritesPageClient({
  events,
  artists,
  venues
}: {
  events: MockEvent[];
  artists: MockOrganizer[];
  venues: FavoriteVenue[];
}) {
  const [tab, setTab] = useState<FavoriteTab>('events');
  const empty = emptyCopy[tab];

  const hasItems =
    tab === 'events'
      ? events.length > 0
      : tab === 'artists'
        ? artists.length > 0
        : venues.length > 0;

  return (
    <div className="max-w-6xl">
      <AccountProfileTabs />

      <section className="mt-2 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <h1 className="text-xl font-bold tracking-tight">Favorilerim</h1>
          <div className="inline-flex w-fit rounded-full bg-muted/80 p-1">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  tab === item.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-14 md:px-6 md:py-20">
          {!hasItems ? (
            <div className="mx-auto max-w-md text-center">
              <p className="text-lg font-semibold text-foreground/90">
                {empty.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {empty.description}
              </p>
              {empty.cta && (
                <Link
                  href={empty.cta.href}
                  className="mt-5 inline-flex text-sm font-semibold text-primary hover:underline"
                >
                  {empty.cta.label}
                </Link>
              )}
            </div>
          ) : tab === 'events' ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => (
                <EventifyCard key={event.id} event={event} isFavorite />
              ))}
            </div>
          ) : tab === 'artists' ? (
            <div className="mx-auto max-w-3xl space-y-4">
              {artists.map((organizer) => (
                <OrganizerCard key={organizer.id} organizer={organizer} />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
