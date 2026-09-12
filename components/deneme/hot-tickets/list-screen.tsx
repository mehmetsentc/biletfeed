'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { BottomNav, type HotTicketsTab } from '@/components/deneme/hot-tickets/bottom-nav';
import { DayCardCarousel } from '@/components/deneme/hot-tickets/day-card-carousel';
import { EventCard } from '@/components/deneme/hot-tickets/event-card';
import type { HotTicketEvent } from '@/components/deneme/hot-tickets/mock-data';
import {
  eventsSorted,
  formatDayBadge,
  uniqueSortedDates
} from '@/components/deneme/hot-tickets/mock-data';
import {
  PLATFORM_LABEL,
  type HotTicketsPlatform
} from '@/components/deneme/hot-tickets/platform';
import { SideNav } from '@/components/deneme/hot-tickets/side-nav';
import { hotTicketsTheme as T } from '@/components/deneme/hot-tickets/theme';

const DATE_ITEM_H = 56;
const DATE_GAP = 10;

type ListScreenProps = {
  events: HotTicketEvent[];
  selectedDate: string;
  tab: HotTicketsTab;
  platform: HotTicketsPlatform;
  onTabChange: (tab: HotTicketsTab) => void;
  onSelectDate: (date: string) => void;
  onOpenEvent: (event: HotTicketEvent) => void;
};

export function ListScreen({
  events,
  selectedDate,
  tab,
  platform,
  onTabChange,
  onSelectDate,
  onOpenEvent
}: ListScreenProps) {
  const sorted = useMemo(() => eventsSorted(events), [events]);
  const dates = useMemo(() => uniqueSortedDates(sorted), [sorted]);
  const monthLabel = formatDayBadge(dates[0] ?? selectedDate).month;

  const feedRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const syncLock = useRef(false);
  const activeDateRef = useRef(selectedDate);
  const [activeDate, setActiveDate] = useState(selectedDate);
  const [focusId, setFocusId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (platform === 'mobile') return sorted;
    return sorted.filter((e) => e.date === activeDate);
  }, [sorted, activeDate, platform]);

  const commitDate = useCallback(
    (iso: string) => {
      if (iso === activeDateRef.current) return;
      activeDateRef.current = iso;
      setActiveDate(iso);
      onSelectDate(iso);
    },
    [onSelectDate]
  );

  useEffect(() => {
    activeDateRef.current = selectedDate;
    setActiveDate(selectedDate);
  }, [selectedDate]);

  const scrollFeedToDate = useCallback(
    (iso: string, behavior: ScrollBehavior = 'smooth') => {
      const feed = feedRef.current;
      if (!feed) return;
      const section = feed.querySelector<HTMLElement>(`[data-date-section="${iso}"]`);
      if (!section) return;
      syncLock.current = true;
      const top = section.offsetTop - 8;
      feed.scrollTo({ top, behavior });
      window.setTimeout(() => {
        syncLock.current = false;
      }, behavior === 'smooth' ? 420 : 80);
    },
    []
  );

  const scrollRailToDate = useCallback((iso: string, behavior: ScrollBehavior = 'smooth') => {
    const rail = railRef.current;
    if (!rail) return;
    const btn = rail.querySelector<HTMLElement>(`[data-date-rail="${iso}"]`);
    if (!btn) return;
    const railRect = rail.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const vertical = rail.scrollHeight > rail.clientHeight + 8;
    if (vertical) {
      const delta =
        btnRect.top - railRect.top - railRect.height / 2 + btnRect.height / 2 + rail.scrollTop;
      rail.scrollTo({ top: Math.max(0, delta), behavior });
    } else {
      const delta =
        btnRect.left - railRect.left - railRect.width / 2 + btnRect.width / 2 + rail.scrollLeft;
      rail.scrollTo({ left: Math.max(0, delta), behavior });
    }
  }, []);

  const selectDate = useCallback(
    (iso: string) => {
      commitDate(iso);
      if (platform === 'mobile') {
        scrollFeedToDate(iso);
        scrollRailToDate(iso);
      }
    },
    [commitDate, platform, scrollFeedToDate, scrollRailToDate]
  );

  useLayoutEffect(() => {
    if (platform !== 'mobile') return;
    scrollFeedToDate(selectedDate, 'auto');
    scrollRailToDate(selectedDate, 'auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  useEffect(() => {
    if (platform !== 'mobile') return;
    const feed = feedRef.current;
    if (!feed) return;

    const sections = Array.from(
      feed.querySelectorAll<HTMLElement>('[data-date-section]')
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (syncLock.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top) return;
        const iso = top.target.getAttribute('data-date-section');
        if (!iso || iso === activeDateRef.current) return;
        commitDate(iso);
        scrollRailToDate(iso);
      },
      {
        root: feed,
        rootMargin: '-8% 0px -55% 0px',
        threshold: [0.15, 0.35, 0.55]
      }
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [sorted, commitDate, scrollRailToDate, platform]);

  // TV: ok tuşlarıyla kartlar arası gezinme
  useEffect(() => {
    if (platform !== 'tv') return;
    const ids = filtered.map((e) => e.id);
    if (ids.length === 0) return;
    setFocusId((prev) => (prev && ids.includes(prev) ? prev : ids[0]!));

    const cols = 3;
    const onKey = (e: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
        return;
      }
      e.preventDefault();
      setFocusId((current) => {
        const idx = Math.max(0, ids.indexOf(current ?? ids[0]!));
        let next = idx;
        if (e.key === 'ArrowRight') next = Math.min(ids.length - 1, idx + 1);
        if (e.key === 'ArrowLeft') next = Math.max(0, idx - 1);
        if (e.key === 'ArrowDown') next = Math.min(ids.length - 1, idx + cols);
        if (e.key === 'ArrowUp') next = Math.max(0, idx - cols);
        if (e.key === 'Enter') {
          const event = filtered[next];
          if (event) onOpenEvent(event);
        }
        return ids[next] ?? current;
      });
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [platform, filtered, onOpenEvent]);

  const showSide = platform === 'web' || platform === 'tv';
  const showBottom = platform === 'mobile' || platform === 'tablet';

  return (
    <div
      className={`relative flex h-full ${showSide ? 'flex-row' : 'flex-col'}`}
      style={{
        background:
          platform === 'web' || platform === 'tv'
            ? 'radial-gradient(1200px 600px at 10% -10%, #F8FFD9 0%, #ffffff 45%, #fafafa 100%)'
            : '#ffffff'
      }}
    >
      {showSide ? (
        <aside
          className={`flex shrink-0 flex-col border-r border-zinc-100/80 bg-white/80 backdrop-blur ${
            platform === 'tv' ? 'w-[280px] px-6 py-8' : 'w-[220px] px-4 py-6'
          }`}
        >
          <SideNav active={tab} onChange={onTabChange} platform={platform} />
          <div className="mt-8 min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <p
              className={`mb-2 font-bold tracking-wider text-zinc-300 ${
                platform === 'tv' ? 'text-sm' : 'text-[10px]'
              }`}
            >
              {monthLabel}
            </p>
            <div className={`flex flex-col ${platform === 'tv' ? 'gap-2' : 'gap-1'}`}>
              {dates.map((iso) => {
                const { day, weekday } = formatDayBadge(iso);
                const active = iso === activeDate;
                return (
                  <button
                    key={iso}
                    type="button"
                    data-date-rail={iso}
                    onClick={() => selectDate(iso)}
                    className={`flex items-center gap-3 rounded-2xl text-left transition ${
                      platform === 'tv' ? 'min-h-[64px] px-4' : 'min-h-[44px] px-3'
                    }`}
                    style={
                      active
                        ? { backgroundColor: T.accent, color: T.onAccent }
                        : { color: '#71717a' }
                    }
                  >
                    <span className={`font-bold ${platform === 'tv' ? 'text-2xl' : 'text-lg'}`}>
                      {day}
                    </span>
                    <span className={`font-semibold ${platform === 'tv' ? 'text-base' : 'text-xs'}`}>
                      {weekday}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className={`flex shrink-0 items-center justify-between ${
            platform === 'tv'
              ? 'px-10 pb-4 pt-8'
              : platform === 'web'
                ? 'px-8 pb-3 pt-6'
                : 'px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h1
              className={`font-bold tracking-tight text-zinc-900 ${
                platform === 'tv'
                  ? 'text-4xl'
                  : platform === 'web'
                    ? 'text-[28px]'
                    : 'text-[22px]'
              }`}
            >
              {showSide ? 'Bu günün etkinlikleri' : 'Hot Tickets'}
            </h1>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: T.soft, color: T.ink }}
            >
              {PLATFORM_LABEL[platform]}
            </span>
          </div>
          {!showSide ? (
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full text-zinc-700"
              aria-label="Ara"
            >
              <Search className="size-5" strokeWidth={1.75} />
            </button>
          ) : (
            <p className={`text-zinc-500 ${platform === 'tv' ? 'text-lg' : 'text-sm'}`}>
              {formatDayBadge(activeDate).day} {formatDayBadge(activeDate).weekday} ·{' '}
              {filtered.length} etkinlik
            </p>
          )}
        </header>

        {/* Tablet: yatay tarih şeridi */}
        {platform === 'tablet' ? (
          <div
            ref={railRef}
            className="shrink-0 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max items-center gap-2">
              {dates.map((iso) => {
                const { day, weekday } = formatDayBadge(iso);
                const active = iso === activeDate;
                return (
                  <button
                    key={iso}
                    type="button"
                    data-date-rail={iso}
                    onClick={() => selectDate(iso)}
                    className="relative flex h-14 min-w-[64px] flex-col items-center justify-center rounded-full px-3"
                  >
                    {active ? (
                      <motion.span
                        layoutId="hot-tickets-date-pill"
                        className="absolute inset-0 rounded-full shadow-md"
                        style={{
                          backgroundColor: T.accent,
                          boxShadow: `0 6px 18px ${T.glow}`
                        }}
                        transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.7 }}
                      />
                    ) : null}
                    <span
                      className="relative z-10 text-[15px] font-bold leading-none"
                      style={{ color: active ? T.onAccent : T.muted }}
                    >
                      {day}
                    </span>
                    <span
                      className="relative z-10 mt-1 text-[9px] font-semibold"
                      style={{ color: active ? T.onAccent : T.muted }}
                    >
                      {weekday}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className={`flex min-h-0 flex-1 ${platform === 'mobile' ? 'gap-2 pl-2 pr-3' : ''}`}>
          {/* Mobil dikey tarih şeridi */}
          {platform === 'mobile' ? (
            <aside className="relative flex w-[52px] shrink-0 flex-col">
              <p className="mb-1 text-center text-[10px] font-bold tracking-wider text-zinc-300">
                {monthLabel}
              </p>
              <div
                ref={railRef}
                className="relative min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain touch-pan-y [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
                style={{
                  maskImage:
                    'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
                  WebkitMaskImage:
                    'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)'
                }}
              >
                <div style={{ height: DATE_ITEM_H }} aria-hidden />
                <div className="relative flex flex-col items-center" style={{ gap: DATE_GAP }}>
                  {dates.map((iso) => {
                    const { day, weekday } = formatDayBadge(iso);
                    const active = iso === activeDate;
                    return (
                      <button
                        key={iso}
                        type="button"
                        data-date-rail={iso}
                        onClick={() => selectDate(iso)}
                        className="relative flex h-14 w-12 shrink-0 snap-center flex-col items-center justify-center"
                        aria-pressed={active}
                      >
                        {active ? (
                          <motion.span
                            layoutId="hot-tickets-date-pill"
                            className="absolute inset-0 rounded-full shadow-md"
                            style={{
                              backgroundColor: T.accent,
                              boxShadow: `0 6px 18px ${T.glow}`
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 420,
                              damping: 36,
                              mass: 0.7
                            }}
                          />
                        ) : null}
                        <span
                          className="relative z-10 text-[15px] font-bold leading-none"
                          style={{ color: active ? T.onAccent : T.muted }}
                        >
                          {day}
                        </span>
                        <span
                          className="relative z-10 mt-1 text-[9px] font-semibold tracking-wide"
                          style={{ color: active ? T.onAccent : T.muted }}
                        >
                          {weekday}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ height: DATE_ITEM_H * 1.4 }} aria-hidden />
              </div>
            </aside>
          ) : null}

          <div
            ref={feedRef}
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              platform === 'tv'
                ? 'px-10 pb-10'
                : platform === 'web'
                  ? 'px-8 pb-8'
                  : platform === 'tablet'
                    ? 'px-5 pb-4'
                    : 'pb-3'
            }`}
          >
            {platform === 'mobile' ? (
              <div className="flex flex-col gap-5">
                {dates.map((iso) => {
                  const dayEvents = sorted.filter((e) => e.date === iso);
                  return (
                    <section key={iso} data-date-section={iso}>
                      <DayCardCarousel events={dayEvents} onOpenEvent={onOpenEvent} />
                    </section>
                  );
                })}
              </div>
            ) : (
              <div
                className={
                  platform === 'tv'
                    ? 'grid grid-cols-3 gap-8'
                    : platform === 'web'
                      ? 'grid grid-cols-3 gap-5'
                      : 'grid grid-cols-2 gap-4'
                }
              >
                {filtered.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    platform={platform}
                    onOpen={onOpenEvent}
                    focused={platform === 'tv' && focusId === event.id}
                  />
                ))}
                {filtered.length === 0 ? (
                  <p className="col-span-full py-20 text-center text-sm text-zinc-400">
                    Bu tarihte etkinlik yok
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {showBottom ? <BottomNav active={tab} onChange={onTabChange} /> : null}
      </div>
    </div>
  );
}
