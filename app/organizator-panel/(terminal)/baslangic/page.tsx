import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink, Plus, ScanLine } from 'lucide-react';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerSalesStats } from '@/lib/services/organizer-sales-stats';
import { getOrganizerCheckInStats } from '@/lib/services/ticket-admin';
import { CheckInStatsPanel } from '@/components/organizator-panel/check-in-stats';
import { SalesStatsGrid } from '@/components/organizator-panel/sales-stats-grid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGirisUrl } from '@/lib/config/domain';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function OrganizatorHomePage() {
  const { t } = await getServerTranslations();
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const [salesStats, checkIn] = await Promise.all([
    getOrganizerSalesStats(organizer.id),
    getOrganizerCheckInStats(organizer.id)
  ]);
  const gateTerminalUrl = getGirisUrl('/tarayici');

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t.dashboard.title}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {t.dashboard.salesSummaryTitle}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {t.dashboard.salesSummarySubtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg" className="gap-2 font-semibold shadow-sm">
            <a href={gateTerminalUrl} target="_blank" rel="noopener noreferrer">
              <ScanLine className="size-5" strokeWidth={2} />
              {t.organizerNav.scanner}
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-semibold">
            <Link href="/organizator-panel/etkinlik/yeni">
              <Plus className="size-4" />
              {t.organizerNav.newEvent}
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t.dashboard.gateTerminalTitle}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t.dashboard.gateTerminalDesc}
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 gap-2 font-medium">
            <a href={gateTerminalUrl} target="_blank" rel="noopener noreferrer">
              {t.dashboard.openGateTerminal}
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <SalesStatsGrid initial={salesStats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">{t.dashboard.checkInSummary}</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckInStatsPanel stats={checkIn} showSummary={false} />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{t.dashboard.quickActions}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="secondary" className="h-11 justify-start font-medium">
              <Link href="/organizator-panel/davetiyeler">
                {t.dashboard.sendInvitation}
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-11 justify-start font-medium">
              <Link href="/organizator-panel/etkinlikler">
                {t.dashboard.manageEvents}
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-11 justify-start font-medium">
              <Link href="/organizator-panel/siparisler">
                {t.dashboard.viewSales}
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-11 justify-start font-medium">
              <Link href="/organizator-panel/biletler">
                {t.dashboard.ticketList}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 justify-start font-medium">
              <Link href="/organizator-panel/ayarlar">
                {t.organizerNav.settings}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
