import type { MockEvent } from '@/lib/data/mock-events';
import type { HeroBannerSlide } from '@/lib/banners/hero-slide-types';
import { HERO_BANNER_LIMIT } from '@/lib/banners/hero-slide-types';
import { buildEventPromoCopy } from '@/lib/banners/promo-copy';
import { isUpcomingEvent } from '@/lib/events/upcoming';
import { getActiveHomeBanners, type HomeBannerRecord } from '@/lib/services/home-banners';
import {
  getFeaturedEvents,
  getTrendingEvents,
  getEventsByCityAndNearby
} from '@/lib/services/events';

function bannerToSlide(banner: HomeBannerRecord): HeroBannerSlide {
  return {
    id: banner.id,
    title: banner.title,
    highlight: banner.subtitle ?? 'Öne Çıkan',
    promoLine: banner.subtitle ? '' : '',
    coverImage: banner.imageDesktop,
    linkUrl: banner.linkUrl ?? '/etkinlikler',
    imageMobile: banner.imageMobile,
    imageTablet: banner.imageTablet,
    imageDesktop: banner.imageDesktop
  };
}

function eventToSlide(event: MockEvent): HeroBannerSlide {
  const { highlight, promoLine } = buildEventPromoCopy(event);
  return {
    id: `event-${event.id}`,
    title: event.title,
    highlight,
    promoLine,
    coverImage: event.coverImage,
    linkUrl: `/etkinlik/${event.slug}`
  };
}

function sortEventsForHero(events: MockEvent[], citySlug: string): MockEvent[] {
  return [...events].sort((a, b) => {
    const aCity = a.citySlug === citySlug ? 0 : 1;
    const bCity = b.citySlug === citySlug ? 0 : 1;
    if (aCity !== bCity) return aCity - bCity;
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    if (a.isTrending !== b.isTrending) return a.isTrending ? -1 : 1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
}

function pickAutoEvents(events: MockEvent[], citySlug: string, limit: number): MockEvent[] {
  const upcoming = events.filter((event) => isUpcomingEvent(event));
  const sorted = sortEventsForHero(upcoming, citySlug);
  const seen = new Set<string>();
  const picked: MockEvent[] = [];

  for (const event of sorted) {
    if (picked.length >= limit) break;
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    picked.push(event);
  }

  return picked;
}

/** Ana sayfa hero — admin banner + otomatik etkinlik slaytları (max 5) */
export async function getHomeHeroSlides(citySlug: string): Promise<HeroBannerSlide[]> {
  const [manualBanners, featured, trending, cityEvents] = await Promise.all([
    getActiveHomeBanners(),
    getFeaturedEvents(),
    getTrendingEvents(),
    getEventsByCityAndNearby(citySlug)
  ]);

  const slides: HeroBannerSlide[] = manualBanners
    .slice(0, HERO_BANNER_LIMIT)
    .map(bannerToSlide);

  if (slides.length >= HERO_BANNER_LIMIT) {
    return slides.slice(0, HERO_BANNER_LIMIT);
  }

  const remaining = HERO_BANNER_LIMIT - slides.length;
  const usedEventIds = new Set(
    manualBanners.map((b) => b.eventId).filter((id): id is string => Boolean(id))
  );

  const pool = pickAutoEvents(
    [...featured, ...trending, ...cityEvents],
    citySlug,
    remaining + usedEventIds.size
  ).filter((e) => !usedEventIds.has(e.id));

  for (const event of pool) {
    if (slides.length >= HERO_BANNER_LIMIT) break;
    slides.push(eventToSlide(event));
  }

  return slides;
}
