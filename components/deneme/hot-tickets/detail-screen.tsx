'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  Mic2,
  Ticket
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FlirtSwipeDeck } from '@/components/deneme/hot-tickets/flirt-swipe-deck';
import type { HotTicketEvent } from '@/components/deneme/hot-tickets/mock-data';
import { formatDayBadge } from '@/components/deneme/hot-tickets/mock-data';
import type { HotTicketsPlatform } from '@/components/deneme/hot-tickets/platform';
import { SwipeHint } from '@/components/deneme/hot-tickets/swipe-hint';
import { hotTicketsTheme as T } from '@/components/deneme/hot-tickets/theme';

type DetailScreenProps = {
  event: HotTicketEvent;
  dayEvents: HotTicketEvent[];
  dates: string[];
  platform?: HotTicketsPlatform;
  onBack: () => void;
  onSelectDate: (date: string) => void;
  onSelectEvent: (event: HotTicketEvent) => void;
};

export function DetailScreen({
  event,
  dayEvents,
  dates,
  platform = 'mobile',
  onBack,
  onSelectDate,
  onSelectEvent
}: DetailScreenProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const syncingRail = useRef(false);
  const eventDateRef = useRef(event.date);
  eventDateRef.current = event.date;

  const dateIndex = Math.max(0, dates.indexOf(event.date));
  const eventIndex = Math.max(
    0,
    dayEvents.findIndex((e) => e.id === event.id)
  );
  const multi = dayEvents.length > 1;
  /** Stack’te görünen alttaki kart: gün içi sonraki (yoksa diğer etkinlik) */
  const stackNext =
    multi && eventIndex < dayEvents.length - 1
      ? dayEvents[eventIndex + 1]!
      : multi && eventIndex > 0
        ? dayEvents[eventIndex - 1]!
        : null;

  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    setHintVisible(true);
    const t = window.setTimeout(() => setHintVisible(false), 4800);
    return () => window.clearTimeout(t);
  }, [event.date]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const btn = rail.querySelector<HTMLElement>(`[data-detail-date="${event.date}"]`);
    if (!btn) return;
    syncingRail.current = true;
    const railRect = rail.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const target =
      rail.scrollLeft + (btnRect.left - railRect.left) - railRect.width / 2 + btnRect.width / 2;
    rail.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    window.setTimeout(() => {
      syncingRail.current = false;
    }, 380);
  }, [event.date]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let timer: number | undefined;

    const pickNearest = () => {
      if (syncingRail.current) return;
      const railRect = rail.getBoundingClientRect();
      const centerX = railRect.left + railRect.width / 2;
      let nearest: { iso: string; dist: number } | null = null;
      for (const iso of dates) {
        const el = rail.querySelector<HTMLElement>(`[data-detail-date="${iso}"]`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const mid = r.left + r.width / 2;
        const dist = Math.abs(mid - centerX);
        if (!nearest || dist < nearest.dist) nearest = { iso, dist };
      }
      if (nearest && nearest.iso !== eventDateRef.current) {
        onSelectDate(nearest.iso);
      }
    };

    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(pickNearest, 90);
    };

    rail.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      rail.removeEventListener('scroll', onScroll);
    };
  }, [dates, onSelectDate]);

  function goSwipe(direction: 1 | -1) {
    setHintVisible(false);
    if (multi) {
      const nextIdx = eventIndex + direction;
      if (nextIdx >= 0 && nextIdx < dayEvents.length) {
        const next = dayEvents[nextIdx];
        if (next) onSelectEvent(next);
        return;
      }
    }
    const nextDate = dates[dateIndex + direction];
    if (nextDate) onSelectDate(nextDate);
  }

  const wide = platform === 'web' || platform === 'tv' || platform === 'tablet';

  useEffect(() => {
    if (platform !== 'tv' && platform !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goSwipe(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goSwipe(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // goSwipe closes over latest event indices; rebind when selection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, event.id, event.date, dayEvents, dates, onBack]);

  return (
    <div
      className={`relative flex h-full ${wide ? 'mx-auto max-w-[1100px] flex-row' : 'flex-col'}`}
      style={{ backgroundColor: T.heroBg }}
    >
      <div className={`relative min-h-0 overflow-hidden ${wide ? 'flex-[1.15]' : 'flex-1'}`}>
        <FlirtSwipeDeck
          event={event}
          nextEvent={stackNext}
          onSwipe={goSwipe}
        >
          <div
            className={`pointer-events-none absolute inset-x-0 z-10 ${
              wide ? 'bottom-10 px-8' : 'bottom-[36%] px-5'
            }`}
          >
            <h2
              className={`font-bold leading-none tracking-tight text-white drop-shadow-lg ${
                platform === 'tv' ? 'text-5xl' : wide ? 'text-4xl' : 'text-[34px]'
              }`}
            >
              {event.title}
            </h2>
            {multi ? (
              <div className="mt-3 flex gap-1.5">
                {dayEvents.map((e, i) => (
                  <span
                    key={e.id}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === eventIndex ? 18 : 6,
                      backgroundColor: i === eventIndex ? T.accent : 'rgba(255,255,255,0.35)'
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </FlirtSwipeDeck>

        {multi && hintVisible && !wide ? <SwipeHint edge /> : null}
        {multi && hintVisible ? (
          <div className="pointer-events-none absolute inset-x-0 top-[40%] z-[2] flex justify-center">
            <SwipeHint
              label={wide ? '← → ile geç · Esc ile geri' : 'Sola / sağa kaydır'}
            />
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-3 pt-[max(1rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={onBack}
            className="pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm"
            aria-label="Geri"
          >
            <ArrowLeft className="size-5" strokeWidth={2} />
          </button>

          <div
            ref={railRef}
            className="pointer-events-auto mx-2 min-w-0 flex-1 overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex w-max items-start justify-center gap-2 px-[28%]">
              {dates.map((iso) => {
                const badge = formatDayBadge(iso);
                const active = iso === event.date;
                return (
                  <button
                    key={iso}
                    type="button"
                    data-detail-date={iso}
                    onClick={() => onSelectDate(iso)}
                    className="relative flex w-12 shrink-0 snap-center flex-col items-center"
                  >
                    <span
                      className="mb-1 h-1.5 w-5 rounded-full transition-colors duration-200"
                      style={{ backgroundColor: active ? T.accent : 'transparent' }}
                    />
                    <span
                      className={`flex size-11 flex-col items-center justify-center rounded-full text-[11px] font-bold leading-none transition-colors duration-200 ${
                        active ? 'shadow-lg' : 'bg-white/10 text-white/70'
                      }`}
                      style={
                        active ? { backgroundColor: T.accent, color: T.onAccent } : undefined
                      }
                    >
                      <span>{badge.day}</span>
                      <span className="mt-0.5 text-[8px] font-semibold opacity-80">
                        {badge.weekday}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm"
            aria-label="Favori"
          >
            <Heart className="size-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        className={`relative z-20 shrink-0 bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.18)] ${
          wide
            ? 'flex w-full max-w-[420px] flex-col justify-end rounded-none px-8 py-8'
            : '-mt-10 rounded-t-[32px] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6'
        }`}
      >
        {multi ? (
          <div className="mb-4 flex justify-center gap-3">
            {wide ? (
              <>
                <button
                  type="button"
                  onClick={() => goSwipe(-1)}
                  className="flex size-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: T.soft }}
                  aria-label="Önceki"
                >
                  <ChevronLeft className="size-5" style={{ color: T.ink }} />
                </button>
                <button
                  type="button"
                  onClick={() => goSwipe(1)}
                  className="flex size-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: T.soft }}
                  aria-label="Sonraki"
                >
                  <ChevronRight className="size-5" style={{ color: T.ink }} />
                </button>
              </>
            ) : (
              <motion.span
                className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{ backgroundColor: T.soft, color: T.ink }}
                animate={{ x: [0, -10, 10, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronLeft className="size-3.5" strokeWidth={2.5} style={{ color: T.accent }} />
                <span>{dayEvents.length} etkinlik — kaydır</span>
                <ChevronRight className="size-3.5" strokeWidth={2.5} style={{ color: T.accent }} />
              </motion.span>
            )}
          </div>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
              <span className="flex items-center gap-1.5">
                <Mic2 className="size-3.5 text-zinc-400" />
                {event.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Ticket className="size-3.5 text-zinc-400" />
                {event.priceLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-zinc-400" />
                {event.time}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
              <p className="flex min-w-0 items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-zinc-800">
                <MapPin className="size-4 shrink-0 text-zinc-400" />
                <span className="truncate">{event.venue}</span>
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <a
          href="/etkinlikler"
          className={`mt-5 flex w-full items-center justify-center rounded-2xl font-bold shadow-md transition hover:brightness-105 active:scale-[0.99] ${
            platform === 'tv' ? 'h-16 text-xl' : 'h-12 text-[15px]'
          }`}
          style={{
            backgroundColor: T.accent,
            color: T.onAccent,
            boxShadow: `0 8px 24px ${T.glow}`
          }}
        >
          Bilet Al
        </a>
      </div>
    </div>
  );
}
