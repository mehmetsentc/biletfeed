import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Users, Calendar, Share2 } from 'lucide-react';
import { PageHero } from '@/components/layout/page-hero';
import { EventCard } from '@/components/events/event-card';
import { Button } from '@/components/ui/button';
import { getOrganizerBySlug } from '@/lib/services/organizers';
import { getEventsByOrganizer } from '@/lib/services/events';
import { createPageMetadata } from '@/lib/seo/metadata';

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

  const events = await getEventsByOrganizer(slug);

  return (
    <>
      <div className="relative h-48 md:h-64">
        <Image
          src={organizer.coverImage}
          alt={organizer.name}
          fill
          className="object-cover"
          priority
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
          <div className="flex gap-2">
            <Button>Takip Et</Button>
            <Button variant="outline" size="icon">
              <Share2 className="size-4" />
            </Button>
          </div>
        </div>

        <h2 className="mb-6 mt-10 text-xl font-bold">Etkinlikler</h2>
        {events.length === 0 ? (
          <p className="text-muted-foreground">Henüz etkinlik yok.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
