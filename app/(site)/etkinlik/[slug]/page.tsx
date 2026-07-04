import { notFound } from 'next/navigation';
import { getAllEvents, getEventBySlugForViewer } from '@/lib/services/events';
import { EventifyCard } from '@/components/events/eventify-card';
import { getOrganizerBySlug } from '@/lib/services/organizers';
import { verifySessionCookie } from '@/lib/auth/session';
import { getFollowedOrganizerIds } from '@/lib/services/follows';
import { getFavoriteEventIds } from '@/lib/services/favorites';
import { EventLocationSection } from '@/components/events/event-location-section';
import { EventHostedBy } from '@/components/events/event-hosted-by';
import { EventMobileTicketBar } from '@/components/events/event-mobile-ticket-bar';
import { EventDetailHeader } from '@/components/events/event-detail-header';
import { EventPreviewBanner } from '@/components/events/event-preview-banner';
import { Badge } from '@/components/ui/badge';
import { filterPublicEventTags } from '@/lib/events/public-tags';
import { isUpcomingEvent } from '@/lib/events/upcoming';
import { isExternalListing } from '@/lib/events/ticket-url';
import { JsonLd } from '@/lib/seo/json-ld';
import { createEventMetadata } from '@/lib/seo/metadata';
import {
  buildBreadcrumbSchema,
  buildEventSchema
} from '@/lib/seo/schemas';
import { EventRulesSection } from '@/components/events/event-rules-section';
import { siteConfig } from '@/lib/config/site';
import { getEventRulesDisplay } from '@/lib/services/event-rules';
import { resolveLocaleFromCookie } from '@/lib/event-rules/i18n';
import { cookies } from 'next/headers';

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const result = await getEventBySlugForViewer(slug);
  if (!result) return { title: 'Etkinlik Bulunamadı' };
  const { event } = result;

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
  const session = await verifySessionCookie();
  const viewerResult = await getEventBySlugForViewer(slug, session?.uid);

  if (!viewerResult) notFound();

  const { event, isPreview, previewKind } = viewerResult;
  const purchasable =
    !isPreview && event.status === 'published' && isUpcomingEvent(event);
  const organizer = await getOrganizerBySlug(event.organizerSlug);
  const [followedOrganizerIds, favoriteEventIds] = session
    ? await Promise.all([
        getFollowedOrganizerIds(session.uid),
        getFavoriteEventIds(session.uid)
      ])
    : [new Set<string>(), new Set<string>()];
  const isFollowingOrganizer =
    organizer != null && followedOrganizerIds.has(organizer.id);
  const isFavorite = favoriteEventIds.has(event.id);
  const allEvents = await getAllEvents();
  const related = allEvents
    .filter((e) => e.categorySlug === event.categorySlug && e.id !== event.id)
    .slice(0, 3);

  const isOnline = event.isOnline || event.citySlug === 'online';
  const eventUrl = `${siteConfig.url}/etkinlik/${event.slug}`;
  const publicTags = filterPublicEventTags(event.tags);
  const externalListing = isExternalListing(event);
  const normalizedDescription = event.description.trim().toLowerCase();
  const normalizedTitle = event.title.trim().toLowerCase();
  const showDescriptionBlock =
    event.description.trim().length > 0 &&
    normalizedDescription !== normalizedTitle &&
    normalizedDescription !== event.shortDescription.trim().toLowerCase();

  const cookieStore = await cookies();
  const locale = resolveLocaleFromCookie(cookieStore.get('bf-locale')?.value);
  const rulesDisplay = await getEventRulesDisplay(event.id, locale);
  const schemaRules =
    rulesDisplay?.sections.flatMap((s) => s.items.map((i) => i.displayText)) ??
    (event.rules?.trim()
      ? event.rules.split(/\r?\n/).filter(Boolean)
      : []);

  return (
    <>
      <JsonLd
        data={[
          buildEventSchema(event, { eventRules: schemaRules }),
          buildBreadcrumbSchema([
            { name: 'Ana Sayfa', url: siteConfig.url },
            { name: 'Etkinlikler', url: `${siteConfig.url}/etkinlikler` },
            { name: event.title, url: eventUrl }
          ])
        ]}
      />
      <div className="bg-muted/20 pb-28 md:pb-10">
        <div className="container mx-auto space-y-8 px-4 py-6 md:py-8">
          {isPreview && previewKind && (
            <EventPreviewBanner kind={previewKind} />
          )}

          <EventDetailHeader
            event={event}
            eventUrl={eventUrl}
            isFavorite={isFavorite}
            isOnline={isOnline}
            purchasable={purchasable}
          />

          <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:gap-10">
            <div className="space-y-8">
              {showDescriptionBlock && (
                <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
                  <h2 className="text-lg font-bold">Etkinlik Hakkında</h2>
                  <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                    <p className="whitespace-pre-line">{event.description}</p>
                  </div>
                </section>
              )}

              {!isOnline && (
                <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
                  <EventLocationSection
                    venue={event.venue}
                    address={event.address}
                    city={event.city}
                    isOnline={false}
                  />
                </section>
              )}

              {publicTags.length > 0 && (
                <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
                  <h2 className="text-lg font-bold">Etiketler</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {publicTags.map((tag) => (
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

              <EventRulesSection eventId={event.id} />
            </div>

            <aside className="hidden lg:block">
              <div className="rounded-2xl border border-border bg-card p-5">
                {externalListing ? (
                  <EventHostedBy
                    platformLabel={event.organizer}
                    externalUrl={event.externalUrl}
                  />
                ) : (
                  organizer && (
                    <EventHostedBy
                      organizer={organizer}
                      initialFollowing={isFollowingOrganizer}
                    />
                  )
                )}
              </div>
            </aside>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 lg:hidden">
            {externalListing ? (
              <EventHostedBy
                platformLabel={event.organizer}
                externalUrl={event.externalUrl}
              />
            ) : (
              organizer && (
                <EventHostedBy
                  organizer={organizer}
                  initialFollowing={isFollowingOrganizer}
                />
              )
            )}
          </div>
        </div>

        <EventMobileTicketBar event={event} purchasable={purchasable} />

        {related.length > 0 && (
          <section className="border-t border-border bg-background py-12 md:py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold">Benzer etkinlikler</h2>
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
