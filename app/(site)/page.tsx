import Link from 'next/link';
import { HomeHeroDesktop, HomeHeroMobile, HomeHeroTablet } from '@/components/home/home-hero';
import { createPageMetadata } from '@/lib/seo/metadata';
import { EventifyCard } from '@/components/events/eventify-card';
import { CategoryExplore } from '@/components/home/category-explore';
import { PopularEventsSection } from '@/components/home/popular-events-section';
import {
  CreateEventBanner,
  CuratedCtaBanner
} from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { getCityName } from '@/lib/location/cities';
import { getNearbyCitySlugs } from '@/lib/location/detect-city';
import { getPreferredCitySlug } from '@/lib/location/city-preference.server';
import {
  getAllEvents,
  getEventsByCityAndNearby,
  getOnlineEvents,
  getTrendingEvents
} from '@/lib/services/events';

export const metadata = createPageMetadata({
  title: 'Etkinlik Biletleri — Konser, Festival ve Daha Fazlası',
  description:
    'Türkiye genelinde konser, tiyatro, festival ve spor etkinliklerini keşfedin. Bilet Feed ile etkinlik biletlerinizi güvenle alın.',
  path: '/',
  keywords: [
    'etkinlik bilet',
    'konser',
    'festival',
    'tiyatro',
    'bilet al',
    'etkinlik keşfet'
  ]
});

export const revalidate = 300;

const countryMap: Record<string, string> = {
  istanbul: 'Türkiye',
  ankara: 'Türkiye',
  izmir: 'Türkiye',
  antalya: 'Türkiye',
  bursa: 'Türkiye',
  eskisehir: 'Türkiye',
  online: 'Online'
};

function pickCityEvents(
  cityEvents: Awaited<ReturnType<typeof getEventsByCityAndNearby>>,
  allUpcoming: Awaited<ReturnType<typeof getAllEvents>>,
  citySlug: string,
  nearbySlugs: string[]
) {
  if (cityEvents.length >= 3) return cityEvents;
  const filtered = allUpcoming.filter(
    (e) => e.citySlug === citySlug || nearbySlugs.includes(e.citySlug)
  );
  return filtered.length > 0 ? filtered : cityEvents;
}

export default async function HomePage() {
  const citySlug = await getPreferredCitySlug();
  const cityName = getCityName(citySlug);
  const nearbySlugs = getNearbyCitySlugs(citySlug, 4);

  const [cityEvents, online, trending, allUpcoming] = await Promise.all([
    getEventsByCityAndNearby(citySlug),
    getOnlineEvents(),
    getTrendingEvents(),
    getAllEvents()
  ]);

  const heroEvents = pickCityEvents(
    cityEvents,
    allUpcoming,
    citySlug,
    nearbySlugs
  );
  const trendingNearby = trending.filter((e) =>
    nearbySlugs.includes(e.citySlug)
  );
  const displayTrending =
    trendingNearby.length >= 3
      ? trendingNearby
      : heroEvents.length > 0
        ? heroEvents
        : trending.slice(0, 6);

  return (
    <>
      <HomeHeroMobile />
      <HomeHeroTablet />
      <HomeHeroDesktop />

      <CategoryExplore />

      <PopularEventsSection
        events={heroEvents}
        cityName={cityName}
        citySlug={citySlug}
      />

      {online.length > 0 && (
        <section className="border-y bg-muted/30 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold md:text-3xl">
              En İyi Online Etkinlikler
            </h2>
            <p className="mt-2 text-muted-foreground">
              Evden katılabileceğiniz etkinlikleri keşfedin
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {online.slice(0, 6).map((event) => (
                <EventifyCard key={event.id} event={event} />
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Link href="/etkinlikler?online=1">
                <Button
                  variant="outline"
                  size="lg"
                  className="min-w-[200px] rounded-md border-foreground/20 px-12 font-semibold"
                >
                  Daha Fazla
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <CuratedCtaBanner />

      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold md:text-3xl">
            {cityName} ve Yakın Çevrede Yaklaşan Etkinlikler
          </h2>
          <p className="mt-2 text-muted-foreground">
            Biletix, Bubilet, Biletimo ve diğer kaynaklardan güncel etkinlikler
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayTrending.slice(0, 6).map((event) => (
              <EventifyCard
                key={event.id}
                event={event}
                countryBadge={countryMap[event.citySlug] ?? 'Türkiye'}
              />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href={`/etkinlikler?sehir=${citySlug}`}>
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px] rounded-md border-foreground/20 px-12 font-semibold"
              >
                Tümünü Gör
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <CreateEventBanner />
    </>
  );
}
