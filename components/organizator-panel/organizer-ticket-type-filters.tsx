import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  buildOrganizerTicketsHref,
  type OrganizerTicketFilterOption
} from '@/lib/services/organizer-ticket-filters';

export function OrganizerTicketTypeFilters({
  options,
  activeKey,
  eventId
}: {
  options: OrganizerTicketFilterOption[];
  activeKey: string;
  eventId?: string;
}) {
  if (!eventId) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Bilet kategorilerini görmek için yukarıdan bir etkinlik seçin.
      </p>
    );
  }

  const categoryOptions = options.filter((option) => option.key !== 'all');

  if (categoryOptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Bilet kategorisi
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const href = buildOrganizerTicketsHref(eventId, option.key);
          const isActive = option.key === activeKey;

          return (
            <Link
              key={option.key}
              href={href}
              className={cn(
                'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              )}
            >
              <span>{option.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  isActive
                    ? 'bg-primary-foreground/15 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {option.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
