'use client';

import { FollowButton } from '@/components/shared/follow-button';
import { ShareButton } from '@/components/shared/share-button';

interface VenueProfileActionsProps {
  venueId: string;
  venueName: string;
  shareUrl: string;
  initialFollowing?: boolean;
}

export function VenueProfileActions({
  venueId,
  venueName,
  shareUrl,
  initialFollowing = false
}: VenueProfileActionsProps) {
  return (
    <div className="flex gap-2">
      <FollowButton
        type="venue"
        targetId={venueId}
        initialActive={initialFollowing}
      />
      <ShareButton
        variant="icon"
        title={venueName}
        text={`${venueName} — BiletFeed`}
        url={shareUrl}
      />
    </div>
  );
}
