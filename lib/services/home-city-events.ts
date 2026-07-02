import { getCityNameOrDefault, isSupportedCitySlug } from '@/lib/location/cities';
import { getNearbyCitySlugs } from '@/lib/location/detect-city';
import type { MockEvent } from '@/lib/data/mock-events';
import {
  getAllEvents,
  getEventsByCityAndNearby,
  getTrendingEvents
} from '@/lib/services/events';

export type HomeCityEventsBundle = {
  citySlug: string;
  cityName: string;
  heroEvents: MockEvent[];
  displayTrending: MockEvent[];
};

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

  const [cityEvents, trending, allUpcoming] = await Promise.all([
    getEventsByCityAndNearby(citySlug),
    getTrendingEvents(),
    getAllEvents()
  ]);

  const heroEvents = pickCityEvents(
    cityEvents,
    allUpcoming,
    citySlug,
    nearbySlugs
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
    displayTrending
  };
}
