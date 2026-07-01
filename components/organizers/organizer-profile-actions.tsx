'use client';

import { FollowButton } from '@/components/shared/follow-button';
import { ShareButton } from '@/components/shared/share-button';

interface OrganizerProfileActionsProps {
  organizerId: string;
  organizerName: string;
  shareUrl: string;
  initialFollowing?: boolean;
}

export function OrganizerProfileActions({
  organizerId,
  organizerName,
  shareUrl,
  initialFollowing = false
}: OrganizerProfileActionsProps) {
  return (
    <div className="flex gap-2">
      <FollowButton
        type="organizer"
        targetId={organizerId}
        initialActive={initialFollowing}
      />
      <ShareButton
        variant="icon"
        title={organizerName}
        text={`${organizerName} — BiletFeed`}
        url={shareUrl}
      />
    </div>
  );
}
