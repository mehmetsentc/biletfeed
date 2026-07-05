import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createPageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/lib/seo/json-ld';
import { buildItemListSchema } from '@/lib/seo/schemas';
import { siteConfig } from '@/lib/config/site';
import EventsPageClient from './events-client';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllEvents, getCategories } from '@/lib/services/events';
import { CityEventsSeoSection } from '@/components/seo/city-events-seo-section';
import { CITY_COOKIE_NAME } from '@/lib/location/city-preference';
import { isSupportedCitySlug } from '@/lib/location/cities';

export const metadata = createPageMetadata({
  title: 'Etkinlikler',
  description: 'Tüm etkinlikleri keşfedin ve filtreleyin',
  path: '/etkinlikler'
});

/** Scraper sonrası liste güncellensin */
export const revalidate = 300;

function EventsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-64" />
        <Skeleton className="mt-5 h-12 w-full rounded-xl" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <div className="container mx-auto grid gap-5 px-4 py-8 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default async function EventsPage({
  searchParams
}: {
  searchParams: Promise<{ sehir?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const cookieSlug = cookieStore.get(CITY_COOKIE_NAME)?.value;
  const seoCitySlug =
    (params.sehir && isSupportedCitySlug(params.sehir) ? params.sehir : null) ??
    (cookieSlug && isSupportedCitySlug(cookieSlug) ? cookieSlug : null);

  const [events, categories] = await Promise.all([
    getAllEvents(),
    getCategories()
  ]);

  const itemListSchema = buildItemListSchema({
    name: 'Etkinlikler',
    description: 'Tüm etkinlikleri keşfedin ve filtreleyin',
    items: events.slice(0, 20).map((event) => ({
      name: event.title,
      url: `${siteConfig.url}/etkinlik/${event.slug}`,
      description: event.shortDescription,
      image: event.coverImage
    }))
  });

  return (
    <>
      <JsonLd data={itemListSchema} />
      <Suspense fallback={<EventsLoading />}>
        <EventsPageClient
          events={events}
          categories={categories}
          fixedCitySlug={seoCitySlug ?? undefined}
        />
      </Suspense>
      {seoCitySlug ? <CityEventsSeoSection citySlug={seoCitySlug} /> : null}
    </>
  );
}
