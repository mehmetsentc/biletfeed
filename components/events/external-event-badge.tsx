import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  getExternalPlatformLabel,
  isExternalListing
} from '@/lib/events/ticket-url';
import type { MockEvent } from '@/lib/data/mock-events';

export function ExternalEventBadge({ event }: { event: MockEvent }) {
  if (!isExternalListing(event)) return null;

  const label = getExternalPlatformLabel(event.externalPlatform);

  return (
    <Badge
      variant="secondary"
      className="gap-1 rounded-full bg-primary/15 text-primary"
    >
      <ExternalLink className="size-3" />
      {label ? `${label} üzerinden` : 'Harici platform'}
    </Badge>
  );
}
