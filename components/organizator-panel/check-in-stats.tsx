import { Users, UserCheck, Clock, TrendingUp } from 'lucide-react';
import { EntryMetaBadges } from '@/components/tickets/entry-meta-badges';
import { checkInResultLabel } from '@/lib/tickets/entry-display';
import type { getOrganizerCheckInStats } from '@/lib/services/ticket-admin';

export function CheckInStatsPanel({
  stats,
  showSummary = true,
}: {
  stats: Awaited<ReturnType<typeof getOrganizerCheckInStats>>;
  showSummary?: boolean;
}) {
  return (
    <div className="space-y-4">
      {showSummary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Satılan" value={String(stats.sold)} />
          <StatCard icon={UserCheck} label="Giriş Yapan" value={String(stats.checkedIn)} sub={`%${stats.attendancePct} katılım`} />
          <StatCard icon={Clock} label="Bekleyen" value={String(stats.waiting)} />
          <StatCard icon={TrendingUp} label="Kapasite" value={String(stats.totalCapacity)} />
        </div>
      )}

      {stats.recentCheckIns.length > 0 && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Son Girişler</h3>
          <ul className="space-y-2">
            {stats.recentCheckIns.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{row.holderName}</p>
                    <EntryMetaBadges
                      ticketKind={row.ticketKind}
                      categoryLabel={row.categoryLabel}
                      entryCategory={row.entryCategory}
                      size="xs"
                    />
                  </div>
                  <p className="mt-1 text-xs text-foreground/70">
                    {row.eventTitle} · {row.ticketCode}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Intl.DateTimeFormat('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).format(new Date(row.createdAt))}
                  </p>
                </div>
                <span
                  className={
                    row.result === 'VALID'
                      ? 'shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400'
                      : row.result === 'USED'
                        ? 'shrink-0 text-xs font-semibold text-amber-800 dark:text-amber-400'
                        : 'shrink-0 text-xs font-semibold text-destructive'
                  }
                >
                  {checkInResultLabel(row.result)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
