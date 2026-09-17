import type { MockEvent } from '@/lib/data/mock-events';
import type { HeroBannerSlide } from '@/lib/banners/hero-slide-types';
import { HERO_BANNER_LIMIT } from '@/lib/banners/hero-slide-types';
import { buildEventPromoCopy } from '@/lib/banners/promo-copy';
import { isUpcomingEvent } from '@/lib/events/upcoming';
import { excludeSoldOutHomeEvents } from '@/lib/events/sold-out';
import {
  getActiveHomeBanners,
  resolveBannersForCity,
  type HomeBannerRecord
} from '@/lib/services/home-banners';
import {
  getEventBySlug,
  getFeaturedEvents,
  getTrendingEvents,
  getEventsByCity
} from '@/lib/services/events';

/** Admin sabit banner yokken ana sayfa hero — BLOK3 (3 Ekim) + Zeynep (4 Ekim) */
export const DEFAULT_HERO_EVENT_SLUGS = [
  'blok3-konseri',
  'zeynep-bastik-emir-can-igrek-koseri'
] as const;

export function pickDefaultHeroEvents<T extends { slug: string; isSoldOut?: boolean }>(
  events: T[],
  slugs: readonly string[] = DEFAULT_HERO_EVENT_SLUGS
): T[] {
  const bySlug = new Map(events.map((event) => [event.slug, event]));
  const picked: T[] = [];
  for (const slug of slugs) {
    const event = bySlug.get(slug);
    if (!event || event.isSoldOut) continue;
    picked.push(event);
  }
  return picked;
}

async function loadDefaultHeroEvents(): Promise<MockEvent[]> {
  const found = await Promise.all(
    DEFAULT_HERO_EVENT_SLUGS.map((slug) => getEventBySlug(slug))
  );
  return pickDefaultHeroEvents(
    found.filter((event): event is MockEvent => Boolean(event))
  );
}

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
  const upcoming = excludeSoldOutHomeEvents(events).filter((event) =>
    isUpcomingEvent(event)
  );
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
  const [manualBanners, featured, trending, cityEvents, defaultHero] =
    await Promise.all([
      getActiveHomeBanners(),
      getFeaturedEvents(),
      getTrendingEvents(),
      getEventsByCity(citySlug),
      loadDefaultHeroEvents()
    ]);

  const { banners: scoped, pinned } = resolveBannersForCity(manualBanners, citySlug);
  const sellableBanners = scoped.filter((banner) => !banner.eventSoldOut);
  const slides: HeroBannerSlide[] = sellableBanners
    .slice(0, HERO_BANNER_LIMIT)
    .map(bannerToSlide);

  // Sabit banner: carousel yok, otomatik etkinlik eklenmez (tükendiyse otomatik slayta düş)
  if (pinned && sellableBanners.length > 0) {
    return slides.slice(0, 1);
  }

  // Admin şehre özel banner yoksa ana banner bu iki konser (tüm şehirler)
  const hasCitySpecific = sellableBanners.some((b) => b.citySlug === citySlug);
  if (!hasCitySpecific && defaultHero.length > 0) {
    return defaultHero.map(eventToSlide);
  }

  if (slides.length >= HERO_BANNER_LIMIT) {
    return slides.slice(0, HERO_BANNER_LIMIT);
  }

  const remaining = HERO_BANNER_LIMIT - slides.length;
  const usedEventIds = new Set(
    sellableBanners.map((b) => b.eventId).filter((id): id is string => Boolean(id))
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
