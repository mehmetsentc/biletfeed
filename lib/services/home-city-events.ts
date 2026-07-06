import { getCityNameOrDefault, isSupportedCitySlug } from '@/lib/location/cities';
import type { MockEvent } from '@/lib/data/mock-events';
import {
  getEventsByCity,
  getTrendingEvents,
  getCategories
} from '@/lib/services/events';
import { isUpcomingEvent } from '@/lib/events/upcoming';

export type HomeCategorySection = {
  slug: string;
  name: string;
  events: MockEvent[];
};

export type HomeCityEventsBundle = {
  citySlug: string;
  cityName: string;
  heroEvents: MockEvent[];
  displayTrending: MockEvent[];
  popularEvents: MockEvent[];
  bestSellers: MockEvent[];
  categorySections: HomeCategorySection[];
};

const MOBILE_CATEGORY_SLUGS = [
  'muzik',
  'festival',
  'tiyatro',
  'party',
  'spor',
  'komedi',
  'sanat',
  'cocuk'
] as const;

function sortByStartDate(events: MockEvent[]): MockEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

function filterUpcomingInCity(events: MockEvent[], citySlug: string): MockEvent[] {
  return sortByStartDate(
    events.filter((event) => event.citySlug === citySlug && isUpcomingEvent(event))
  );
}

function buildCategorySections(
  cityEvents: MockEvent[],
  categories: Array<{ slug: string; name: string }>
): HomeCategorySection[] {
  const upcoming = sortByStartDate(cityEvents);

  return categories
    .filter((cat) =>
      MOBILE_CATEGORY_SLUGS.includes(
        cat.slug as (typeof MOBILE_CATEGORY_SLUGS)[number]
      )
    )
    .map((cat) => ({
      slug: cat.slug,
      name: cat.name,
      events: upcoming.filter((e) => e.categorySlug === cat.slug).slice(0, 12)
    }))
    .filter((section) => section.events.length > 0);
}

function buildBestSellers(cityEvents: MockEvent[], trending: MockEvent[]): MockEvent[] {
  const now = new Date();
  const fromCity = sortByStartDate(
    cityEvents.filter((e) => e.isTrending && isUpcomingEvent(e, now))
  );
  if (fromCity.length >= 3) return fromCity.slice(0, 12);

  const fromTrending = sortByStartDate(
    trending.filter((e) => isUpcomingEvent(e, now) && e.isTrending)
  );
  return (fromTrending.length > 0 ? fromTrending : cityEvents).slice(0, 12);
}

export function resolveHomeCitySlug(slug: string | null | undefined): string {
  if (slug && isSupportedCitySlug(slug)) {
    return slug;
  }
  return 'istanbul';
}

export async function getHomeCityEventsBundle(
  citySlugInput: string
): Promise<HomeCityEventsBundle> {
  const citySlug = resolveHomeCitySlug(citySlugInput);
  const cityName = getCityNameOrDefault(citySlug);

  const [cityEvents, trending, categories] = await Promise.all([
    getEventsByCity(citySlug),
    getTrendingEvents(),
    getCategories()
  ]);

  const upcomingCity = filterUpcomingInCity(cityEvents, citySlug);
  const trendingInCity = trending.filter((event) => event.citySlug === citySlug);
  const displayTrending =
    trendingInCity.length >= 3 ? trendingInCity : upcomingCity.slice(0, 6);

  return {
    citySlug,
    cityName,
    heroEvents: upcomingCity,
    displayTrending,
    popularEvents: upcomingCity.slice(0, 12),
    bestSellers: buildBestSellers(upcomingCity, trendingInCity),
    categorySections: buildCategorySections(upcomingCity, categories)
  };
}
