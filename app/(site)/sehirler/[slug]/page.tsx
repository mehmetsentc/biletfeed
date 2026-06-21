import { notFound } from 'next/navigation';
import { PageHero } from '@/components/layout/page-hero';
import { EventCard } from '@/components/events/event-card';
import { getEventsByCity, getCities } from '@/lib/services/events';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cities = await getCities();
  const city = cities.find((c) => c.slug === slug);
  return createPageMetadata({
    title: city?.name || 'Şehir',
    path: `/sehirler/${slug}`
  });
}

export default async function CityDetailPage({ params }: Props) {
  const { slug } = await params;
  const cities = await getCities();
  const city = cities.find((c) => c.slug === slug);
  if (!city) notFound();

  const events = await getEventsByCity(slug);

  return (
    <>
      <PageHero
        title={city.name}
        subtitle={`${city.count} etkinlik`}
        breadcrumbs={[
          { label: 'Şehirler', href: '/sehirler' },
          { label: city.name }
        ]}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </>
  );
}
