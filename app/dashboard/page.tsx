import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerStats } from '@/lib/services/organizer-dashboard';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function DashboardPage() {
  const { t } = await getServerTranslations();
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t.dashboard.title}</h1>
        <p className="text-muted-foreground">{t.dashboard.noOrganizerProfile}</p>
        <Link href="/dashboard/etkinlik/yeni">
          <Button>{t.dashboard.newEvent}</Button>
        </Link>
      </div>
    );
  }

  const stats = await getOrganizerStats(organizer.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t.dashboard.title}</h1>
        <Link href="/dashboard/tarayici">
          <Button variant="outline">{t.dashboard.scanner}</Button>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t.dashboard.upcomingEvent, value: String(stats.eventCount) },
          { label: t.dashboard.ticketsSold, value: String(stats.soldTickets) },
          { label: 'Gelir', value: `₺${stats.revenue.toLocaleString('tr-TR')}` },
          { label: t.dashboard.checkedIn, value: String(stats.scannedTickets) }
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
