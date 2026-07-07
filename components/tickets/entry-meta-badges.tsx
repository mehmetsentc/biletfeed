import { cn } from '@/lib/utils';
import type { EntryCategory, EntryTicketKind } from '@/lib/tickets/entry-display';
import {
  entryCategoryBadgeClass,
  entryKindBadgeClass,
  entryTicketKindLabel
} from '@/lib/tickets/entry-display';

export function EntryMetaBadges({
  ticketKind,
  categoryLabel,
  entryCategory,
  className,
  size = 'sm'
}: {
  ticketKind: EntryTicketKind;
  categoryLabel: string;
  entryCategory: EntryCategory;
  className?: string;
  size?: 'sm' | 'xs';
}) {
  const pad = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span
        className={cn(
          'inline-flex rounded-full font-semibold ring-1',
          pad,
          entryKindBadgeClass(ticketKind)
        )}
      >
        {entryTicketKindLabel(ticketKind)}
      </span>
      <span
        className={cn(
          'inline-flex rounded-full font-semibold ring-1',
          pad,
          entryCategoryBadgeClass(entryCategory)
        )}
      >
        {categoryLabel}
      </span>
    </div>
  );
}
