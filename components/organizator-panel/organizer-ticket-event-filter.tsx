import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  buildOrganizerTicketsHref,
  type OrganizerTicketEventOption
} from '@/lib/services/organizer-ticket-filters';

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function OrganizerTicketEventFilter({
  events,
  activeEventId
}: {
  events: OrganizerTicketEventOption[];
  activeEventId?: string;
}) {
  const totalTickets = events.reduce((sum, event) => sum + event.ticketCount, 0);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Etkinlik
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildOrganizerTicketsHref()}
          className={cn(
            'inline-flex max-w-full items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
            !activeEventId
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-card text-foreground hover:bg-muted'
          )}
        >
          <span className="truncate">Tüm etkinlikler</span>
          <span
            className={cn(
              'shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
              !activeEventId
                ? 'bg-primary-foreground/15 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {totalTickets}
          </span>
        </Link>

        {events.map((event) => {
          const isActive = activeEventId === event.id;
          return (
            <Link
              key={event.id}
              href={buildOrganizerTicketsHref(event.id)}
              title={event.title}
              className={cn(
                'inline-flex max-w-[min(100%,280px)] items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              )}
            >
              <span className="truncate">
                {event.title}
                <span
                  className={cn(
                    'ml-1.5 text-[11px] font-normal',
                    isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  )}
                >
                  · {formatEventDate(event.startDate)}
                </span>
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  isActive
                    ? 'bg-primary-foreground/15 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {event.ticketCount}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
