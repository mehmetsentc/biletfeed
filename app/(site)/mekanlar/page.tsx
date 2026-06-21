import Link from 'next/link';
import Image from 'next/image';
import { Building2, CalendarDays, MapPin } from 'lucide-react';
import { PageHero } from '@/components/layout/page-hero';
import { AppIcon } from '@/components/ui/app-icon';
import { getAllVenues } from '@/lib/services/venues';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Mekanlar',
  path: '/mekanlar'
});

export default async function VenuesPage() {
  const mockVenues = await getAllVenues();
  return (
    <>
      <PageHero title="Mekanlar" subtitle="Etkinlik mekanlarını keşfedin" />
      <div className="container mx-auto grid gap-6 px-4 py-12 sm:grid-cols-2">
        {mockVenues.map((venue) => (
          <Link
            key={venue.slug}
            href={`/mekanlar/${venue.slug}`}
            prefetch
            className="group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
          >
            <div className="relative aspect-video overflow-hidden bg-muted">
              <Image
                src={venue.image}
                alt={venue.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3">
                <AppIcon icon={Building2} size="md" variant="primary" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">{venue.name}</h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4 shrink-0 text-primary/80" strokeWidth={1.75} />
                    {venue.address}, {venue.city}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium text-primary">
                    <CalendarDays className="size-4 shrink-0" strokeWidth={1.75} />
                    {venue.eventCount} etkinlik ·{' '}
                    {venue.capacity.toLocaleString('tr-TR')} kapasite
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
