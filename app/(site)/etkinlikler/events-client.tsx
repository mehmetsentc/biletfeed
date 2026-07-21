'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { useTranslations } from '@/components/providers';
import { SUPPORTED_CITIES, getCityName } from '@/lib/location/cities';
import type { MockEvent } from '@/lib/data/mock-events';
import { filterPublicEventTags } from '@/lib/events/public-tags';
import {
  sortEvents,
  type EventSortOption
} from '@/lib/events/sort-events';
import { isUpcomingEvent } from '@/lib/events/upcoming';
import { trackClientSearch } from '@/lib/analytics/track-client-search';

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
  /** Şehir landing (/istanbul-etkinlikleri) veya SEO bloğu için sabit şehir */
  fixedCitySlug?: string;
}

const sortKeys: EventSortOption[] = [
  'relevance',
  'date-asc',
  'date-desc',
  'price-asc',
  'price-desc'
];

function SortSelect({
  value,
  onChange,
  className
}: {
  value: EventSortOption;
  onChange: (value: EventSortOption) => void;
  className?: string;
}) {
  const t = useTranslations();
  const sortLabels: Record<EventSortOption, string> = {
    relevance: t.filters.relevance,
    'date-asc': t.filters.dateNear,
    'date-desc': t.filters.dateFar,
    'price-asc': t.filters.priceLow,
    'price-desc': t.filters.priceHigh
  };

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EventSortOption)}
      className={className}
      aria-label={t.common.sort}
    >
      {sortKeys.map((key) => (
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

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
}

function matchCitySlugFromQuery(query: string): string | null {
  const normalized = normalizeSearchText(query);
  if (!normalized) return null;

  const matched = SUPPORTED_CITIES.find((city) => {
    const cityName = normalizeSearchText(city.name);
    return cityName === normalized || city.slug === normalized;
  });

  return matched?.slug ?? null;
}

function matchesTextQuery(event: MockEvent, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const haystack = normalizeSearchText(
    [
      event.title,
      event.shortDescription,
      event.description,
      event.city,
      event.category,
      event.venue,
      event.organizer,
      event.citySlug,
      ...filterPublicEventTags(event.tags)
    ].join(' ')
  );

  return haystack.includes(normalizedQuery);
}

function resolveSearchScope(
  searchQuery: string,
  showAllCities: boolean,
  urlCity: string,
  preferredCity: string
) {
  const trimmed = searchQuery.trim();
  const cityFromSearch = matchCitySlugFromQuery(trimmed);

  if (showAllCities) {
    return {
      citySlug: '',
      textQuery: cityFromSearch ? '' : trimmed,
      cityLabel: 'Türkiye'
    };
  }

  if (cityFromSearch) {
    return {
      citySlug: cityFromSearch,
      textQuery: '',
      cityLabel: getCityName(cityFromSearch)
    };
  }

  if (trimmed) {
    return {
      citySlug: '',
      textQuery: trimmed,
      cityLabel: 'Türkiye'
    };
  }

  const citySlug = urlCity || preferredCity;
  return {
    citySlug,
    textQuery: '',
    cityLabel: getCityName(citySlug)
  };
}

function filterEvents(
  events: MockEvent[],
  filters: EventsFilters,
  query: string,
  citySlug: string,
  initialDate: string,
  urlDonem: string,
  feedPill: FeedCategoryPill,
  onlineOnly: boolean
): MockEvent[] {
  return events.filter((event) => {
    if (!isUpcomingEvent(event)) return false;

    if (onlineOnly && !event.isOnline && event.categorySlug !== 'online') {
      return false;
    }

    if (query && !matchesTextQuery(event, query)) return false;

    if (citySlug && event.citySlug !== citySlug) return false;

    const eventDate = new Date(event.startDate);
    const now = new Date();
    if (initialDate && event.startDate.slice(0, 10) !== initialDate) return false;
    if (urlDonem === 'weekend' && !isThisWeekend(eventDate, now)) return false;
    if (urlDonem === 'today' && !isSameDay(eventDate, now)) return false;
    if (urlDonem === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      if (!isSameDay(eventDate, tomorrow)) return false;
    }

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

function EmptyState({
  cityName,
  onShowAll,
  turkeyLabel,
  t
}: {
  cityName: string;
  onShowAll?: () => void;
  turkeyLabel: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
      <p className="font-medium text-foreground">{t.events.notFound}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t.events.adjustFilters}</p>
      {onShowAll && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-4 text-sm font-medium text-foreground underline-offset-2 hover:text-[var(--bf-accent-ink)] hover:underline"
        >
          {cityName === turkeyLabel
            ? t.events.clearSearch
            : t.events.searchAllCities(cityName)}
        </button>
      )}
    </div>
  );
}

export default function EventsPageClient({
  events: mockEvents,
  categories,
  fixedCitySlug
}: EventsPageClientProps) {
  const t = useTranslations();
  const { citySlug: preferredCitySlug } = useCity();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const urlCity = searchParams.get('sehir') || '';
  const initialDate = searchParams.get('tarih') || '';
  const urlDonem = searchParams.get('donem') || '';
  const urlKategori = searchParams.get('kategori') || '';
  const initialOnline = searchParams.get('online') === '1';

  const [filters, setFilters] = useState<EventsFilters>(() => ({
    ...defaultEventsFilters,
    categories: urlKategori ? [urlKategori] : []
  }));
  const [sort, setSort] = useState<EventSortOption>('date-asc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [feedPill, setFeedPill] = useState<FeedCategoryPill>('all');
  const [showAllCities, setShowAllCities] = useState(false);

  const { citySlug: effectiveCity, textQuery, cityLabel } = useMemo(
    () => {
      if (fixedCitySlug && !showAllCities) {
        return {
          citySlug: fixedCitySlug,
          textQuery: '',
          cityLabel: getCityName(fixedCitySlug)
        };
      }
      return resolveSearchScope(
        searchQuery,
        showAllCities,
        urlCity || fixedCitySlug || '',
        preferredCitySlug
      );
    },
    [searchQuery, showAllCities, urlCity, preferredCitySlug, fixedCitySlug]
  );
  const activeFilterCount = countActiveFilters(filters);

  const filteredEvents = useMemo(() => {
    const filtered = filterEvents(
      mockEvents,
      filters,
      textQuery,
      effectiveCity,
      initialDate,
      urlDonem,
      feedPill,
      initialOnline
    );
    return sortEvents(filtered, sort);
  }, [
    filters,
    sort,
    textQuery,
    effectiveCity,
    initialDate,
    urlDonem,
    feedPill,
    initialOnline,
    mockEvents
  ]);

  useEffect(() => {
    const q = textQuery.trim();
    if (!q) return;
    const timer = window.setTimeout(() => {
      trackClientSearch(q, filteredEvents.length);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [textQuery, filteredEvents.length]);

  const sortSelect = (
    <SortSelect
      value={sort}
      onChange={setSort}
      className="hidden h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground md:block"
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 bg-gradient-to-r from-primary via-[var(--bf-orange-400)] to-primary/70" aria-hidden />
      <EventsFeedHeader
        cityLabel={cityLabel}
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setShowAllCities(false);
          setSearchQuery(value);
        }}
        activePill={feedPill}
        onPillChange={(pill) => {
          setShowAllCities(false);
          setFeedPill(pill);
        }}
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
        categories={categories}
      />

      <section className="container mx-auto px-4 py-6 md:py-8">
        {filteredEvents.length === 0 ? (
          <EmptyState
            cityName={cityLabel}
            turkeyLabel={t.events.turkey}
            t={t}
            onShowAll={
              !showAllCities && effectiveCity
                ? () => {
                    setShowAllCities(true);
                    setSearchQuery('');
                    setFeedPill('all');
                    setFilters(defaultEventsFilters);
                  }
                : textQuery
                  ? () => {
                      setSearchQuery('');
                      setFeedPill('all');
                      setFilters(defaultEventsFilters);
                    }
                  : undefined
            }
          />
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
