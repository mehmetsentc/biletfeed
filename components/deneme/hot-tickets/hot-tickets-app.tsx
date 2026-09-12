'use client';

import { useMemo, useState } from 'react';
import type { HotTicketsTab } from '@/components/deneme/hot-tickets/bottom-nav';
import { CalendarScreen } from '@/components/deneme/hot-tickets/calendar-screen';
import { DayFeedScreen } from '@/components/deneme/hot-tickets/day-feed-screen';
import { DetailScreen } from '@/components/deneme/hot-tickets/detail-screen';
import { ListScreen } from '@/components/deneme/hot-tickets/list-screen';
import { MoreScreen } from '@/components/deneme/hot-tickets/more-screen';
import {
  HOT_TICKET_EVENTS,
  eventsForDate,
  uniqueSortedDates,
  type HotTicketEvent
} from '@/components/deneme/hot-tickets/mock-data';
import { useHotTicketsPlatform } from '@/components/deneme/hot-tickets/platform';

/**
 * Hot Tickets — platforma göre kabuk:
 * mobile phone chrome · tablet geniş grid · web yan menü · TV büyük odak
 */
export function HotTicketsApp() {
  const platform = useHotTicketsPlatform();
  const dates = useMemo(() => uniqueSortedDates(HOT_TICKET_EVENTS), []);
  const [tab, setTab] = useState<HotTicketsTab>('home');
  const [selectedDate, setSelectedDate] = useState(() => dates[0] ?? '');
  const [activeEvent, setActiveEvent] = useState<HotTicketEvent | null>(null);
  const [calendarDay, setCalendarDay] = useState<string | null>(null);

  const dayEvents = useMemo(
    () => (activeEvent ? eventsForDate(HOT_TICKET_EVENTS, activeEvent.date) : []),
    [activeEvent]
  );

  function handleDetailDate(iso: string) {
    setSelectedDate(iso);
    const next = eventsForDate(HOT_TICKET_EVENTS, iso)[0];
    if (next) setActiveEvent(next);
  }

  function handleSelectEvent(event: HotTicketEvent) {
    setSelectedDate(event.date);
    setActiveEvent(event);
  }

  function handleTabChange(next: HotTicketsTab) {
    setActiveEvent(null);
    setCalendarDay(null);
    setTab(next);
  }

  function handleCalendarPickDate(iso: string) {
    setSelectedDate(iso);
    setCalendarDay(iso);
  }

  const shellMax =
    platform === 'mobile'
      ? 'max-w-[430px]'
      : platform === 'tablet'
        ? 'max-w-[920px]'
        : 'max-w-[1440px]';

  return (
    <div
      className={`relative mx-auto h-full w-full overflow-hidden ${shellMax}`}
      data-platform={platform}
      style={{ backgroundColor: '#ffffff' }}
    >
      <div
        className="absolute inset-0"
        style={{
          visibility: activeEvent || calendarDay ? 'hidden' : 'visible',
          pointerEvents: activeEvent || calendarDay ? 'none' : 'auto',
          zIndex: 10
        }}
        aria-hidden={Boolean(activeEvent || calendarDay)}
      >
        {tab === 'home' ? (
          <ListScreen
            events={HOT_TICKET_EVENTS}
            selectedDate={selectedDate}
            tab={tab}
            platform={platform}
            onTabChange={handleTabChange}
            onSelectDate={setSelectedDate}
            onOpenEvent={setActiveEvent}
          />
        ) : null}
        {tab === 'calendar' ? (
          <CalendarScreen
            events={HOT_TICKET_EVENTS}
            tab={tab}
            platform={platform}
            onTabChange={handleTabChange}
            onPickDate={handleCalendarPickDate}
          />
        ) : null}
        {tab === 'more' ? (
          <MoreScreen tab={tab} platform={platform} onTabChange={handleTabChange} />
        ) : null}
      </div>

      {calendarDay && !activeEvent ? (
        <div className="absolute inset-0 z-20" style={{ backgroundColor: '#ffffff' }}>
          <DayFeedScreen
            date={calendarDay}
            events={HOT_TICKET_EVENTS}
            tab={tab}
            platform={platform}
            onTabChange={handleTabChange}
            onBack={() => setCalendarDay(null)}
            onOpenEvent={setActiveEvent}
          />
        </div>
      ) : null}

      {activeEvent ? (
        <div className="absolute inset-0 z-30" style={{ backgroundColor: '#050505' }}>
          <DetailScreen
            event={activeEvent}
            dayEvents={dayEvents}
            dates={dates}
            platform={platform}
            onBack={() => setActiveEvent(null)}
            onSelectDate={handleDetailDate}
            onSelectEvent={handleSelectEvent}
          />
        </div>
      ) : null}
    </div>
  );
}
