import { notFound } from 'next/navigation';
import { BadgeCheck, Users, Calendar } from 'lucide-react';
import { OrganizerProfileEventCard } from '@/components/events/organizer-profile-event-card';
import { OrganizerProfileActions } from '@/components/organizers/organizer-profile-actions';
import { SafeImage } from '@/components/shared/safe-image';
import { getOrganizerBySlug } from '@/lib/services/organizers';
import { getEventsByOrganizerForProfile } from '@/lib/services/events';
import { verifySessionCookie } from '@/lib/auth/session';
import { getFollowedOrganizerIds } from '@/lib/services/follows';
import { JsonLd } from '@/lib/seo/json-ld';
import { createPageMetadata } from '@/lib/seo/metadata';
import { buildOrganizerSchema } from '@/lib/seo/schemas';
import { siteConfig } from '@/lib/config/site';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const org = await getOrganizerBySlug(slug);
  return createPageMetadata({
    title: org?.name || 'Organizatör',
    path: `/organizator/${slug}`
  });
}

export default async function OrganizerPage({ params }: Props) {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);
  if (!organizer) notFound();

  const session = await verifySessionCookie();
  const { events, isOwner } = await getEventsByOrganizerForProfile(
    slug,
    session?.uid
  );

  const followedIds = session
    ? await getFollowedOrganizerIds(session.uid)
    : new Set<string>();
  const isFollowing = followedIds.has(organizer.id);
  const shareUrl = `${siteConfig.url}/organizator/${organizer.slug}`;

  return (
    <>
      <JsonLd data={buildOrganizerSchema(organizer)} />
      <div className="relative h-48 md:h-64">
        <SafeImage
          src={organizer.coverImage}
          alt={organizer.name}
          fill
          className="object-cover"
          priority
          fallback={
            <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
              <Users className="size-10" strokeWidth={1.5} />
            </div>
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>
      <div className="container mx-auto px-4 pb-12">
        <div className="-mt-12 relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{organizer.name}</h1>
              {organizer.verified && (
                <BadgeCheck className="size-6 text-primary" />
              )}
            </div>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {organizer.description}
            </p>
            <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                {organizer.eventCount} etkinlik
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-4" />
                {organizer.followerCount.toLocaleString('tr-TR')} takipçi
              </span>
            </div>
          </div>
          <OrganizerProfileActions
            organizerId={organizer.id}
            organizerName={organizer.name}
            shareUrl={shareUrl}
            initialFollowing={isFollowing}
          />
        </div>

        <h2 className="mb-6 mt-10 text-xl font-bold">
          Etkinlikler
          {isOwner && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              (taslak ve onay bekleyenler yalnızca size görünür)
            </span>
          )}
        </h2>
        {events.length === 0 ? (
          <p className="text-muted-foreground">Henüz etkinlik yok.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <OrganizerProfileEventCard
                key={event.id}
                event={event}
                isOwner={isOwner}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
