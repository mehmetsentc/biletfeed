import { ExternalLink } from 'lucide-react';
import {
  getExternalPlatformLabel,
  isExternalListing
} from '@/lib/events/ticket-url';
import type { MockEvent } from '@/lib/data/mock-events';
import { cn } from '@/lib/utils';

export function ExternalEventBadge({
  event,
  className
}: {
  event: MockEvent;
  className?: string;
}) {
  if (!isExternalListing(event)) return null;

  const label = getExternalPlatformLabel(event.externalPlatform);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary shadow-[var(--shadow-xs)] backdrop-blur-sm',
        className
      )}
    >
      <ExternalLink className="size-3" />
      {label ? `${label} üzerinden` : 'Harici platform'}
    </span>
  );
}
