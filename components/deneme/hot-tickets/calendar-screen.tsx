'use client';

import { useMemo } from 'react';
import { BottomNav, type HotTicketsTab } from '@/components/deneme/hot-tickets/bottom-nav';
import type { HotTicketEvent } from '@/components/deneme/hot-tickets/mock-data';
import {
  eventsForDate,
  formatDayBadge,
  uniqueSortedDates
} from '@/components/deneme/hot-tickets/mock-data';
import type { HotTicketsPlatform } from '@/components/deneme/hot-tickets/platform';
import { SideNav } from '@/components/deneme/hot-tickets/side-nav';
import { hotTicketsTheme as T } from '@/components/deneme/hot-tickets/theme';

type CalendarScreenProps = {
  events: HotTicketEvent[];
  tab: HotTicketsTab;
  platform: HotTicketsPlatform;
  onTabChange: (tab: HotTicketsTab) => void;
  onPickDate: (date: string) => void;
};

export function CalendarScreen({
  events,
  tab,
  platform,
  onTabChange,
  onPickDate
}: CalendarScreenProps) {
  const dates = useMemo(() => uniqueSortedDates(events), [events]);
  const month = formatDayBadge(dates[0] ?? '').month;
  const showSide = platform === 'web' || platform === 'tv';
  const showBottom = platform === 'mobile' || platform === 'tablet';
  const cols =
    platform === 'tv'
      ? 'grid-cols-7'
      : platform === 'web'
        ? 'grid-cols-7'
        : platform === 'tablet'
          ? 'grid-cols-5'
          : 'grid-cols-4';

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
        </aside>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className={`shrink-0 ${
            platform === 'tv'
              ? 'px-10 pb-4 pt-8'
              : platform === 'web'
                ? 'px-8 pb-3 pt-6'
                : 'px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]'
          }`}
        >
          <h1
            className={`font-bold tracking-tight text-zinc-900 ${
              platform === 'tv' ? 'text-4xl' : 'text-[22px]'
            }`}
          >
            Takvim
          </h1>
          <p className={`mt-1 text-zinc-500 ${platform === 'tv' ? 'text-lg' : 'text-sm'}`}>
            {month} — güne dokun, şehir feed’ine git
          </p>
        </header>

        <div
          className={`min-h-0 flex-1 overflow-y-auto ${
            platform === 'tv' ? 'px-10 pb-10' : platform === 'web' ? 'px-8 pb-8' : 'px-4 pb-4'
          } [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        >
          <div className={`grid gap-2 ${cols} ${platform === 'tv' ? 'gap-4' : ''}`}>
            {dates.map((iso) => {
              const badge = formatDayBadge(iso);
              const count = eventsForDate(events, iso).length;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onPickDate(iso)}
                  className={`flex flex-col items-center rounded-2xl transition-transform active:scale-[0.97] ${
                    platform === 'tv' ? 'min-h-[120px] px-3 py-5' : 'px-2 py-3'
                  }`}
                  style={{ backgroundColor: T.soft, color: T.ink }}
                >
                  <span
                    className={`font-bold leading-none ${
                      platform === 'tv' ? 'text-3xl' : 'text-[18px]'
                    }`}
                  >
                    {badge.day}
                  </span>
                  <span
                    className={`mt-1 font-semibold opacity-70 ${
                      platform === 'tv' ? 'text-sm' : 'text-[10px]'
                    }`}
                  >
                    {badge.weekday}
                  </span>
                  <span
                    className={`mt-2 rounded-full px-2 py-0.5 font-bold ${
                      platform === 'tv' ? 'text-sm' : 'text-[10px]'
                    }`}
                    style={
                      count > 0
                        ? { backgroundColor: T.accent, color: T.onAccent }
                        : { backgroundColor: '#e4e4e4', color: '#7a7a7a' }
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {showBottom ? <BottomNav active={tab} onChange={onTabChange} /> : null}
      </div>
    </div>
  );
}
