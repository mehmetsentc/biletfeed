'use client';

import { FavoriteButton } from '@/components/events/favorite-button';
import { ShareButton } from '@/components/shared/share-button';

interface EventDetailActionsProps {
  title: string;
  shareUrl: string;
  eventId: string;
  initialFavorite?: boolean;
}

export function EventDetailActions({
  title,
  shareUrl,
  eventId,
  initialFavorite = false
}: EventDetailActionsProps) {
  return (
    <div className="flex gap-2">
      <FavoriteButton
        icon="star"
        eventId={eventId}
        initialActive={initialFavorite}
        variant="outline"
      />
      <ShareButton
        variant="icon"
        title={title}
        url={shareUrl}
        className="size-10 rounded-full"
      />
    </div>
  );
}
