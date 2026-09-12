'use client';

import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { BottomNav, type HotTicketsTab } from '@/components/deneme/hot-tickets/bottom-nav';
import { EventCard } from '@/components/deneme/hot-tickets/event-card';
import type { HotTicketEvent } from '@/components/deneme/hot-tickets/mock-data';
import {
  HOT_TICKETS_DEMO_CITY,
  eventsForDate,
  formatDayBadge
} from '@/components/deneme/hot-tickets/mock-data';
import type { HotTicketsPlatform } from '@/components/deneme/hot-tickets/platform';
import { SideNav } from '@/components/deneme/hot-tickets/side-nav';
import { hotTicketsTheme as T } from '@/components/deneme/hot-tickets/theme';

type DayFeedScreenProps = {
  date: string;
  events: HotTicketEvent[];
  city?: string;
  tab: HotTicketsTab;
  platform: HotTicketsPlatform;
  onTabChange: (tab: HotTicketsTab) => void;
  onBack: () => void;
  onOpenEvent: (event: HotTicketEvent) => void;
};

export function DayFeedScreen({
  date,
  events,
  city = HOT_TICKETS_DEMO_CITY,
  tab,
  platform,
  onTabChange,
  onBack,
  onOpenEvent
}: DayFeedScreenProps) {
  const dayEvents = useMemo(
    () =>
      eventsForDate(events, date).filter(
        (e) => e.city.toLocaleLowerCase('tr-TR') === city.toLocaleLowerCase('tr-TR')
      ),
    [events, date, city]
  );
  const badge = formatDayBadge(date);
  const showSide = platform === 'web' || platform === 'tv';
  const showBottom = platform === 'mobile' || platform === 'tablet';
  const cardPlatform: HotTicketsPlatform =
    platform === 'mobile' ? 'tablet' : platform;

  return (
    <div
      className={`relative flex h-full ${showSide ? 'flex-row' : 'flex-col'} bg-white`}
    >
      {showSide ? (
        <aside
          className={`shrink-0 border-r border-zinc-100 ${
            platform === 'tv' ? 'w-[280px] px-6 py-8' : 'w-[220px] px-4 py-6'
          }`}
        >
          <SideNav active={tab} onChange={onTabChange} platform={platform} />
          <button
            type="button"
            onClick={onBack}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl font-semibold ${
              platform === 'tv' ? 'min-h-[64px] text-lg' : 'min-h-[44px] text-sm'
            }`}
            style={{ backgroundColor: T.soft, color: T.ink }}
          >
            <ArrowLeft className="size-4" />
            Takvime dön
          </button>
        </aside>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className={`flex shrink-0 items-center gap-3 ${
            platform === 'tv'
              ? 'px-10 pb-4 pt-8'
              : platform === 'web'
                ? 'px-8 pb-3 pt-6'
                : 'px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]'
          }`}
        >
          {!showSide ? (
            <button
              type="button"
              onClick={onBack}
              className="flex size-10 items-center justify-center rounded-full"
              style={{ backgroundColor: T.soft }}
              aria-label="Takvime dön"
            >
              <ArrowLeft className="size-5" style={{ color: T.ink }} />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <h1
              className={`truncate font-bold tracking-tight text-zinc-900 ${
                platform === 'tv' ? 'text-4xl' : 'text-[20px]'
              }`}
            >
              {city}
            </h1>
            <p className={`text-zinc-500 ${platform === 'tv' ? 'text-lg' : 'text-sm'}`}>
              {badge.day} {badge.weekday} · {badge.month} · {dayEvents.length} etkinlik
            </p>
          </div>
        </header>

        <div
          className={`min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            platform === 'tv'
              ? 'px-10 pb-10'
              : platform === 'web'
                ? 'px-8 pb-8'
                : 'px-3 pb-4'
          }`}
        >
          {dayEvents.length === 0 ? (
            <p className="px-2 py-16 text-center text-sm text-zinc-400">
              Bu şehirde bu tarihte etkinlik yok
            </p>
          ) : (
            <div
              className={
                platform === 'mobile'
                  ? 'flex flex-col gap-3'
                  : platform === 'tablet'
                    ? 'grid grid-cols-2 gap-4'
                    : platform === 'tv'
                      ? 'grid grid-cols-3 gap-8'
                      : 'grid grid-cols-3 gap-5'
              }
            >
              {dayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  platform={cardPlatform}
                  onOpen={onOpenEvent}
                />
              ))}
            </div>
          )}
        </div>

        {showBottom ? <BottomNav active={tab} onChange={onTabChange} /> : null}
      </div>
    </div>
  );
}
