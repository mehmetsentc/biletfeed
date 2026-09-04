import type { MockEvent } from '@/lib/data/mock-events';
import type { HeroBannerSlide } from '@/lib/banners/hero-slide-types';
import { HERO_BANNER_LIMIT } from '@/lib/banners/hero-slide-types';
import { buildEventPromoCopy } from '@/lib/banners/promo-copy';
import { isUpcomingEvent } from '@/lib/events/upcoming';
import {
  getActiveHomeBanners,
  resolveBannersForCity,
  type HomeBannerRecord
} from '@/lib/services/home-banners';
import {
  getFeaturedEvents,
  getTrendingEvents,
  getEventsByCity
} from '@/lib/services/events';

/** Admin’de şehir banner’ı yokken kullanılan varsayılan sabit etkinlik slug’ları */
const CITY_DEFAULT_PINNED_EVENT_SLUG: Record<string, string> = {
  antalya: 'blok3-konseri'
};

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

/** Ana sayfa hero — admin banner (şehir/sabit) + otomatik etkinlik slaytları */
export async function getHomeHeroSlides(citySlug: string): Promise<HeroBannerSlide[]> {
  const [manualBanners, featured, trending, cityEvents] = await Promise.all([
    getActiveHomeBanners(),
    getFeaturedEvents(),
    getTrendingEvents(),
    getEventsByCity(citySlug)
  ]);

  const { banners: scoped, pinned } = resolveBannersForCity(manualBanners, citySlug);
  const slides: HeroBannerSlide[] = scoped
    .slice(0, HERO_BANNER_LIMIT)
    .map(bannerToSlide);

  // Sabit banner: carousel yok, otomatik etkinlik eklenmez
  if (pinned) {
    return slides.slice(0, 1);
  }

  // Şehre özel admin banner yoksa varsayılan sabit etkinlik (ör. Antalya → BLOK3)
  const hasCitySpecific = scoped.some((b) => b.citySlug === citySlug);
  const defaultPinnedSlug = CITY_DEFAULT_PINNED_EVENT_SLUG[citySlug];
  if (!hasCitySpecific && defaultPinnedSlug) {
    const pool = [...cityEvents, ...featured, ...trending];
    const pinnedEvent = pool.find(
      (e) => e.slug === defaultPinnedSlug && isUpcomingEvent(e)
    );
    if (pinnedEvent) {
      return [eventToSlide(pinnedEvent)];
    }
  }

  if (slides.length >= HERO_BANNER_LIMIT) {
    return slides.slice(0, HERO_BANNER_LIMIT);
  }

  const remaining = HERO_BANNER_LIMIT - slides.length;
  const usedEventIds = new Set(
    scoped.map((b) => b.eventId).filter((id): id is string => Boolean(id))
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
