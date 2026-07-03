'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/shared/follow-button';
import type { MockOrganizer } from '@/lib/data/mock-organizers';

interface EventHostedByProps {
  organizer?: MockOrganizer;
  platformLabel?: string;
  externalUrl?: string;
  initialFollowing?: boolean;
}

export function EventHostedBy({
  organizer,
  platformLabel,
  externalUrl,
  initialFollowing = false
}: EventHostedByProps) {
  if (platformLabel) {
    return (
      <section>
        <h2 className="text-xl font-bold">Bilet Satış Platformu</h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-orange-300">
              <span className="text-xl font-bold text-primary-foreground">
                {platformLabel.charAt(0)}
              </span>
            </div>
            <p className="text-lg font-bold">{platformLabel}</p>
          </div>
          {externalUrl && (
            <Button
              variant="outline"
              className="rounded-md px-6 sm:ml-auto"
              asChild
            >
              <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Resmi siteye git
              </a>
            </Button>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Bu etkinlik Bilet Feed üzerinden değil, {platformLabel} platformunda
          listelenmektedir.
        </p>
      </section>
    );
  }

  if (!organizer) return null;

  return (
    <section className="min-w-0">
      <h2 className="text-xl font-bold">Organizatör</h2>
      <div className="mt-4 space-y-4">
        <Link
          href={`/organizator/${organizer.slug}`}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary to-orange-300">
            {organizer.logo ? (
              <Image
                src={organizer.logo}
                alt={organizer.name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-lg font-bold text-primary-foreground">
                {organizer.name.charAt(0)}
              </span>
            )}
          </div>
          <p className="min-w-0 truncate text-lg font-bold hover:text-primary">
            {organizer.name}
          </p>
        </Link>
        <FollowButton
          type="organizer"
          targetId={organizer.id}
          initialActive={initialFollowing}
          showIcon
          className="h-11 w-full justify-center rounded-lg font-semibold"
        />
      </div>
    </section>
  );
}
