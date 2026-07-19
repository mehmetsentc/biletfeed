import Link from 'next/link';
import { CalendarDays, Clock3 } from 'lucide-react';
import {
  formatEventDateLong,
  formatEventTime
} from '@/lib/data/mock-events';
import type { EventSeriesSession } from '@/lib/services/event-series';
import { cn } from '@/lib/utils';

function formatSessionTimeRange(startIso: string, endIso: string): string {
  const start = formatEventTime(startIso);
  const end = formatEventTime(endIso);
  const diffH =
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / (60 * 60 * 1000);
  if (diffH <= 0 || diffH > 8) return start;
  return `${start} - ${end}`;
}

interface EventSeriesSessionsProps {
  sessions: EventSeriesSession[];
}

export function EventSeriesSessions({ sessions }: EventSeriesSessionsProps) {
  if (sessions.length <= 1) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="text-lg font-bold">Seanslar</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Bu etkinliğin farklı tarihlerde {sessions.length} seansı bulunuyor.
      </p>
      <ul className="mt-4 space-y-3">
        {sessions.map((session) => {
          const startIso = session.startDate.toISOString();
          const endIso = session.endDate.toISOString();

          return (
            <li key={session.id}>
              {session.isCurrent ? (
                <div
                  className={cn(
                    'flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between'
                  )}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--bf-accent-ink)]">
                      Seans {session.sessionIndex || '—'} · Bu sayfa
                    </p>
                    <p className="font-medium">{formatEventDateLong(startIso)}</p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock3 className="size-3.5 shrink-0" />
                      {formatSessionTimeRange(startIso, endIso)}
                    </p>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/etkinlik/${session.slug}`}
                  className="flex flex-col gap-2 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Seans {session.sessionIndex || '—'}
                    </p>
                    <p className="font-medium">{formatEventDateLong(startIso)}</p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock3 className="size-3.5 shrink-0" />
                      {formatSessionTimeRange(startIso, endIso)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--bf-accent-ink)]">
                    <CalendarDays className="size-4" />
                    Bu seansı gör
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
