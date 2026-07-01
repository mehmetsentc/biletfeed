'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/shared/follow-button';
import type { MockOrganizer } from '@/lib/data/mock-organizers';

interface EventHostedByProps {
  organizer: MockOrganizer;
  initialFollowing?: boolean;
}

export function EventHostedBy({
  organizer,
  initialFollowing = false
}: EventHostedByProps) {
  return (
    <section>
      <h2 className="text-xl font-bold">Organizatör</h2>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href={`/organizator/${organizer.slug}`}
          className="flex items-center gap-4"
        >
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary to-orange-300">
            {organizer.logo ? (
              <Image
                src={organizer.logo}
                alt={organizer.name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-xl font-bold text-primary-foreground">
                {organizer.name.charAt(0)}
              </span>
            )}
          </div>
          <p className="text-lg font-bold hover:text-primary">{organizer.name}</p>
        </Link>
        <div className="flex gap-3 sm:ml-auto">
          <Button variant="outline" className="rounded-md px-6" asChild>
            <Link href={`/organizator/${organizer.slug}`}>İletişim</Link>
          </Button>
          <FollowButton
            type="organizer"
            targetId={organizer.id}
            initialActive={initialFollowing}
            variant="dark"
            showIcon
          />
        </div>
      </div>
    </section>
  );
}
