import { Suspense } from 'react';
import { createPageMetadata } from '@/lib/seo/metadata';
import EventsPageClient from './events-client';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllEvents, getCategories } from '@/lib/services/events';

export const metadata = createPageMetadata({
  title: 'Etkinlikler',
  description: 'Tüm etkinlikleri keşfedin ve filtreleyin',
  path: '/etkinlikler'
});

/** Scraper sonrası liste güncellensin */
export const revalidate = 300;

function EventsLoading() {
  return (
    <div className="min-h-screen bg-[#0c1017]">
      <div className="border-b border-white/10 px-4 py-8">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <Skeleton className="mt-3 h-4 w-64 bg-white/10" />
        <Skeleton className="mt-5 h-12 w-full rounded-xl bg-white/10" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full bg-white/10" />
          ))}
        </div>
      </div>
      <div className="container mx-auto grid gap-5 px-4 py-8 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] rounded-xl bg-white/10" />
        ))}
      </div>
    </div>
  );
}

export default async function EventsPage() {
  const [events, categories] = await Promise.all([
    getAllEvents(),
    getCategories()
  ]);

  return (
    <Suspense fallback={<EventsLoading />}>
      <EventsPageClient events={events} categories={categories} />
    </Suspense>
  );
}
