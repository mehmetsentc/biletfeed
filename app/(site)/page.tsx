import Link from 'next/link';
import { HomeFeedTabs } from '@/components/feed/home-feed-tabs';
import { HomeHeroSection } from '@/components/home/home-hero-section';
import { createPageMetadata } from '@/lib/seo/metadata';
import { EventifyCard } from '@/components/events/eventify-card';
import { CategoryExplore } from '@/components/home/category-explore';
import { HomeCityEvents } from '@/components/home/home-city-events';
import {
  CreateEventBanner
} from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { getPreferredCitySlug } from '@/lib/location/city-preference.server';
import { getHomeCityEventsBundle } from '@/lib/services/home-city-events';
import { getHomeHeroSlides } from '@/lib/services/home-hero-slides';
import { getOnlineEvents, getCategories } from '@/lib/services/events';

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

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const citySlug = await getPreferredCitySlug();
  const [cityBundle, online, heroSlides, categories] = await Promise.all([
    getHomeCityEventsBundle(citySlug),
    getOnlineEvents(),
    getHomeHeroSlides(citySlug),
    getCategories()
  ]);

  return (
    <>
      <HomeHeroSection slides={heroSlides} categories={categories} />

      <section className="container mx-auto px-4 py-6">
        <HomeFeedTabs />
      </section>

      <CategoryExplore />

      <HomeCityEvents initial={cityBundle} />

      {online.length > 0 && (
        <section className="border-y border-border/80 bg-muted/30 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              En İyi Online Etkinlikler
            </h2>
            <p className="mt-3 text-base font-medium text-muted-foreground">
              Evden katılabileceğiniz etkinlikleri keşfedin
            </p>
            <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
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

      <CreateEventBanner />
    </>
  );
}
