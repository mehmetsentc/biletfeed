import { getCityNameOrDefault, isSupportedCitySlug } from '@/lib/location/cities';
import { getNearbyCitySlugs } from '@/lib/location/detect-city';
import type { MockEvent } from '@/lib/data/mock-events';
import {
  getAllEvents,
  getEventsByCityAndNearby,
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

function buildBestSellers(
  cityEvents: MockEvent[],
  trending: MockEvent[],
  nearbySlugs: string[]
): MockEvent[] {
  const now = new Date();
  const fromCity = sortByStartDate(
    cityEvents.filter((e) => e.isTrending && isUpcomingEvent(e, now))
  );
  if (fromCity.length >= 3) return fromCity.slice(0, 12);

  const fromTrending = sortByStartDate(
    trending.filter(
      (e) =>
        isUpcomingEvent(e, now) &&
        (nearbySlugs.includes(e.citySlug) || e.isTrending)
    )
  );
  return (fromTrending.length > 0 ? fromTrending : cityEvents).slice(0, 12);
}

function pickCityEvents(
  cityEvents: MockEvent[],
  allUpcoming: MockEvent[],
  citySlug: string,
  nearbySlugs: string[]
): MockEvent[] {
  if (cityEvents.length >= 3) return cityEvents;
  const filtered = allUpcoming.filter(
    (event) =>
      event.citySlug === citySlug || nearbySlugs.includes(event.citySlug)
  );
  return filtered.length > 0 ? filtered : cityEvents;
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
  const nearbySlugs = getNearbyCitySlugs(citySlug, 4);

  const [cityEvents, trending, allUpcoming, categories] = await Promise.all([
    getEventsByCityAndNearby(citySlug),
    getTrendingEvents(),
    getAllEvents(),
    getCategories()
  ]);

  const heroEvents = pickCityEvents(
    cityEvents,
    allUpcoming,
    citySlug,
    nearbySlugs
  );
  const upcomingCity = sortByStartDate(
    heroEvents.filter((e) => isUpcomingEvent(e))
  );
  const trendingNearby = trending.filter((event) =>
    nearbySlugs.includes(event.citySlug)
  );
  const displayTrending =
    trendingNearby.length >= 3
      ? trendingNearby
      : heroEvents.length > 0
        ? heroEvents
        : trending.slice(0, 6);

  return {
    citySlug,
    cityName,
    heroEvents,
    displayTrending,
    popularEvents: upcomingCity.slice(0, 12),
    bestSellers: buildBestSellers(heroEvents, trending, nearbySlugs),
    categorySections: buildCategorySections(heroEvents, categories)
  };
}
