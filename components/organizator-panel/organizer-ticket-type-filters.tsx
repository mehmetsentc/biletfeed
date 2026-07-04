import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { OrganizerTicketFilterOption } from '@/lib/services/organizer-ticket-filters';

export function OrganizerTicketTypeFilters({
  options,
  activeKey
}: {
  options: OrganizerTicketFilterOption[];
  activeKey: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const href =
          option.key === 'all'
            ? '/organizator-panel/biletler'
            : `/organizator-panel/biletler?type=${encodeURIComponent(option.key)}`;
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
                isActive ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {option.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
