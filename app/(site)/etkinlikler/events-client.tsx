'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  EventsFeedHeader,
  matchesFeedCategoryPill,
  type FeedCategoryPill
} from '@/components/events/events-feed-header';
import { NahaberEventCard } from '@/components/events/nahaber-event-card';
import { EventsFilterPanel } from '@/components/events/events-filter-panels';
import {
  defaultEventsFilters,
  type DateFilter,
  type EventsFilters
} from '@/components/events/events-filter-sidebar';
import { countActiveFilters } from '@/components/events/events-filter-utils';
import { useCity } from '@/components/providers/city-provider';
import { cities, type MockEvent } from '@/lib/data/mock-events';

type CategoryItem = {
  slug: string;
  name: string;
  icon: string;
  count: number;
  image: string;
};

interface EventsPageClientProps {
  events: MockEvent[];
  categories: CategoryItem[];
}

type SortOption = 'relevance' | 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc';

const sortLabels: Record<SortOption, string> = {
  relevance: 'İlgililik',
  'date-asc': 'Tarih (yakın)',
  'date-desc': 'Tarih (uzak)',
  'price-asc': 'Fiyat (düşük)',
  'price-desc': 'Fiyat (yüksek)'
};

function SortSelect({
  value,
  onChange,
  className
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className={className}
      aria-label="Sıralama"
    >
      {(Object.keys(sortLabels) as SortOption[]).map((key) => (
        <option key={key} value={key}>
          {sortLabels[key]}
        </option>
      ))}
    </select>
  );
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isThisWeekend(date: Date, now: Date) {
  const day = now.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  const eventDay = new Date(date);
  eventDay.setHours(0, 0, 0, 0);
  return isSameDay(eventDay, saturday) || isSameDay(eventDay, sunday);
}

function isThisWeek(date: Date, now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  const eventDate = new Date(date);
  return eventDate >= start && eventDate <= end;
}

function matchesDateFilter(event: MockEvent, filters: EventsFilters): boolean {
  if (filters.date.length === 0) return true;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const eventDate = new Date(event.startDate);

  return filters.date.some((filter: DateFilter) => {
    switch (filter) {
      case 'today':
        return isSameDay(eventDate, now);
      case 'tomorrow':
        return isSameDay(eventDate, tomorrow);
      case 'week':
        return isThisWeek(eventDate, now);
      case 'weekend':
        return isThisWeekend(eventDate, now);
      case 'pick':
        return filters.customDate
          ? event.startDate.slice(0, 10) === filters.customDate
          : true;
      default:
        return true;
    }
  });
}

function filterEvents(
  events: MockEvent[],
  filters: EventsFilters,
  query: string,
  initialCity: string,
  initialDate: string,
  feedPill: FeedCategoryPill
): MockEvent[] {
  return events.filter((event) => {
    if (query) {
      const q = query.toLowerCase();
      const match =
        event.title.toLowerCase().includes(q) ||
        event.city.toLowerCase().includes(q) ||
        event.category.toLowerCase().includes(q) ||
        event.venue.toLowerCase().includes(q) ||
        event.citySlug.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (initialCity && event.citySlug !== initialCity) return false;
    if (initialDate && event.startDate.slice(0, 10) !== initialDate) return false;

    if (!matchesFeedCategoryPill(event, feedPill)) return false;

    if (filters.price.length > 0) {
      const isFree = event.isFree;
      const priceMatch =
        (filters.price.includes('free') && isFree) ||
        (filters.price.includes('paid') && !isFree);
      if (!priceMatch) return false;
    }

    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(event.categorySlug)
    ) {
      return false;
    }

    if (
      filters.formats.length > 0 &&
      !filters.formats.includes(event.eventType as EventsFilters['formats'][number])
    ) {
      return false;
    }

    if (!matchesDateFilter(event, filters)) return false;

    return true;
  });
}

function sortEvents(events: MockEvent[], sort: SortOption): MockEvent[] {
  const sorted = [...events];
  switch (sort) {
    case 'date-asc':
      return sorted.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    case 'date-desc':
      return sorted.sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    default:
      return sorted.sort((a, b) => {
        if (a.isTrending !== b.isTrending) return a.isTrending ? -1 : 1;
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return b.attendees - a.attendees;
      });
  }
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#151b24] py-16 text-center">
      <p className="font-medium text-white">Etkinlik bulunamadı</p>
      <p className="mt-1 text-sm text-white/50">
        Filtreleri veya arama terimini değiştirmeyi deneyin
      </p>
    </div>
  );
}

function resolveCityLabel(citySlug: string, searchQuery: string): string {
  if (citySlug) {
    const city = cities.find((c) => c.slug === citySlug);
    if (city) return city.name;
  }

  const q = searchQuery.trim().toLowerCase();
  if (q) {
    const matched = cities.find(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
    if (matched) return matched.name;
    return searchQuery.trim();
  }

  return 'Türkiye';
}

export default function EventsPageClient({
  events: mockEvents
}: EventsPageClientProps) {
  const { citySlug: preferredCitySlug } = useCity();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const urlCity = searchParams.get('sehir') || '';
  const activeCity = urlCity || preferredCitySlug;
  const initialDate = searchParams.get('tarih') || '';

  const [filters, setFilters] = useState<EventsFilters>(defaultEventsFilters);
  const [sort, setSort] = useState<SortOption>('date-asc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    activeCity
      ? cities.find((c) => c.slug === activeCity)?.name ?? initialQuery
      : initialQuery
  );
  const [feedPill, setFeedPill] = useState<FeedCategoryPill>('all');

  const cityLabel = resolveCityLabel(activeCity, searchQuery);
  const activeFilterCount = countActiveFilters(filters);

  const filteredEvents = useMemo(() => {
    const filtered = filterEvents(
      mockEvents,
      filters,
      searchQuery.trim(),
      activeCity,
      initialDate,
      feedPill
    );
    return sortEvents(filtered, sort);
  }, [
    filters,
    sort,
    searchQuery,
    activeCity,
    initialDate,
    feedPill,
    mockEvents
  ]);

  const sortSelect = (
    <SortSelect
      value={sort}
      onChange={setSort}
      className="hidden h-10 rounded-lg border border-white/15 bg-[#151b24] px-3 text-sm font-medium text-white/80 md:block"
    />
  );

  return (
    <div className="min-h-screen bg-[#0c1017]">
      <EventsFeedHeader
        cityLabel={cityLabel}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        activePill={feedPill}
        onPillChange={setFeedPill}
        resultCount={filteredEvents.length}
        onOpenFilters={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount}
        sortSelect={sortSelect}
      />

      <EventsFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={setFilters}
        resultCount={filteredEvents.length}
      />

      <section className="container mx-auto px-4 py-6 md:py-8">
        {filteredEvents.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <NahaberEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
