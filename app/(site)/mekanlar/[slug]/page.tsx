import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Users } from 'lucide-react';
import { PageHero } from '@/components/layout/page-hero';
import { EventCard } from '@/components/events/event-card';
import { getVenueBySlug } from '@/lib/services/venues';
import { getAllEvents } from '@/lib/services/events';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  return createPageMetadata({
    title: venue?.name || 'Mekan',
    path: `/mekanlar/${slug}`
  });
}

export default async function VenueDetailPage({ params }: Props) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) notFound();

  const allEvents = await getAllEvents();
  const events = allEvents.filter(
    (e) => e.venue.toLowerCase().includes(venue.name.split(' ')[0].toLowerCase())
  );

  return (
    <>
      <PageHero
        title={venue.name}
        subtitle={venue.description}
        breadcrumbs={[
          { label: 'Mekanlar', href: '/mekanlar' },
          { label: venue.name }
        ]}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 grid gap-8 lg:grid-cols-2">
          <div className="relative aspect-video overflow-hidden rounded-2xl">
            <Image src={venue.image} alt={venue.name} fill className="object-cover" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-5" />
              {venue.address}, {venue.city}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-5" />
              Kapasite: {venue.capacity.toLocaleString('tr-TR')} · {venue.eventCount} etkinlik
            </div>
            <p className="leading-relaxed text-muted-foreground">{venue.description}</p>
          </div>
        </div>
        <h2 className="mb-6 text-xl font-bold">Bu Mekandaki Etkinlikler</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </>
  );
}
