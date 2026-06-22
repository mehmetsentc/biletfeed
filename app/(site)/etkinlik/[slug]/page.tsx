import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  formatEventDate,
  formatEventTime
} from '@/lib/data/mock-events';
import { getEventBySlug, getAllEvents } from '@/lib/services/events';
import { getOrganizerBySlug } from '@/lib/services/organizers';
import { EventDetailActions } from '@/components/events/event-detail-actions';
import { EventDateTime } from '@/components/events/event-date-time';
import { EventLocationSection } from '@/components/events/event-location-section';
import { EventHostedBy } from '@/components/events/event-hosted-by';
import { EventTicketSidebar } from '@/components/events/event-ticket-sidebar';
import { EventMobileTicketBar } from '@/components/events/event-mobile-ticket-bar';
import { EventTabletTicketBar } from '@/components/events/event-tablet-ticket-bar';
import { ExternalEventBadge } from '@/components/events/external-event-badge';
import { EventifyCard } from '@/components/events/eventify-card';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/lib/seo/json-ld';
import { createEventMetadata } from '@/lib/seo/metadata';
import {
  buildBreadcrumbSchema,
  buildEventSchema
} from '@/lib/seo/schemas';
import { siteConfig } from '@/lib/config/site';

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: 'Etkinlik Bulunamadı' };

  return createEventMetadata({
    title: event.title,
    slug,
    description: event.shortDescription,
    image: event.coverImage,
    city: event.city,
    venue: event.venue,
    startDate: event.startDate,
    category: event.category,
    isFree: event.isFree,
    price: event.price
  });
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  const organizer = await getOrganizerBySlug(event.organizerSlug);
  const allEvents = await getAllEvents();
  const related = allEvents
    .filter((e) => e.categorySlug === event.categorySlug && e.id !== event.id)
    .slice(0, 3);

  const isOnline = event.isOnline || event.citySlug === 'online';
  const eventUrl = `${siteConfig.url}/etkinlik/${event.slug}`;

  return (
    <>
      <JsonLd
        data={[
          buildEventSchema(event),
          buildBreadcrumbSchema([
            { name: 'Ana Sayfa', url: siteConfig.url },
            { name: 'Etkinlikler', url: `${siteConfig.url}/etkinlikler` },
            { name: event.title, url: eventUrl }
          ])
        ]}
      />
    <div className="bg-background pb-28 md:pb-16">
      <div className="container mx-auto px-4 py-8 md:py-10">
        {/* Hero banner — Figma */}
        <div className="relative aspect-[21/9] min-h-[220px] overflow-hidden rounded-xl md:min-h-[320px]">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width:768px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white md:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80 md:text-sm">
              {event.category}
            </p>
            <p className="mt-2 max-w-lg text-lg font-bold leading-tight md:text-2xl">
              {event.shortDescription}
            </p>
            <p className="mt-3 text-sm text-white/90 md:text-base">
              {formatEventDate(event.startDate)}
            </p>
            <p className="text-sm text-white/80">
              {isOnline ? 'Online' : `${event.venue}, ${event.city}`} ·{' '}
              {formatEventTime(event.startDate)}
            </p>
          </div>
        </div>

        {/* Başlık + aksiyonlar */}
        <div className="mt-6 flex items-start justify-between gap-4 md:mt-8">
          <div className="space-y-2">
            <ExternalEventBadge event={event} />
            <h1 className="text-2xl font-bold md:text-3xl lg:text-4xl">
              {event.title}
            </h1>
          </div>
          <EventDetailActions title={event.title} slug={event.slug} />
        </div>

        <div className="mt-5">
          <EventTabletTicketBar event={event} />
        </div>

        {/* İki sütun */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-12">
          <div className="space-y-10">
            <EventDateTime event={event} />
            <EventLocationSection
              venue={event.venue}
              address={event.address}
              city={event.city}
              isOnline={isOnline}
            />
            {organizer && <EventHostedBy organizer={organizer} />}

            <section>
              <h2 className="text-xl font-bold">Etkinlik Açıklaması</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                <p>{event.description}</p>
                {event.isFree && (
                  <p className="font-medium text-foreground">
                    Ücretsiz etkinlik — yerinizi hemen ayırtın!
                  </p>
                )}
              </div>
            </section>

            {event.tags.length > 0 && (
              <section>
                <h2 className="text-xl font-bold">Etiketler</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full bg-muted px-4 py-1.5 text-sm font-normal"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="hidden lg:block">
            <EventTicketSidebar event={event} />
          </div>
        </div>
      </div>

      <EventMobileTicketBar event={event} />

      {/* Benzer etkinlikler */}
      {related.length > 0 && (
        <section className="border-t bg-muted/20 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold">Beğenebileceğiniz diğer etkinlikler</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((e) => (
                <EventifyCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
    </>
  );
}
