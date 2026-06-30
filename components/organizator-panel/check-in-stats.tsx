import { Users, UserCheck, Clock, TrendingUp } from 'lucide-react';
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
              <li key={row.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">{row.holderName}</p>
                  <p className="text-xs text-muted-foreground">{row.eventTitle} · {row.ticketCode}</p>
                </div>
                <span
                  className={
                    row.result === 'VALID'
                      ? 'text-[var(--bf-success)]'
                      : row.result === 'USED'
                        ? 'text-amber-600'
                        : 'text-destructive'
                  }
                >
                  {row.result}
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
