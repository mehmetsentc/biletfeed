import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  CalendarDays,
  Plus,
  ScanLine,
  Ticket,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerStats } from '@/lib/services/organizer-dashboard';
import { getOrganizerCheckInStats } from '@/lib/services/ticket-admin';
import { CheckInStatsPanel } from '@/components/organizator-panel/check-in-stats';
import { DashboardStatCard } from '@/components/organizator-panel/dashboard-stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function OrganizatorHomePage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const [stats, checkIn] = await Promise.all([
    getOrganizerStats(organizer.id),
    getOrganizerCheckInStats(organizer.id),
  ]);

  const revenueFormatted = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(stats.revenue);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Organizatör Paneli</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Merhaba, {organizer.name}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Etkinliklerinizi yönetin, bilet satışlarını takip edin ve girişleri QR ile
            doğrulayın.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg" className="gap-2 font-semibold shadow-sm">
            <Link href="/organizator-panel/tarayici">
              <ScanLine className="size-5" strokeWidth={2} />
              Bilet Tara
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-semibold">
            <Link href="/organizator-panel/etkinlik/yeni">
              <Plus className="size-4" />
              Yeni Etkinlik
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Yaklaşan Etkinlik"
          value={String(stats.eventCount)}
          hint="Yayında ve gelecek tarihli"
          icon={CalendarDays}
        />
        <DashboardStatCard
          label="Satılan Bilet"
          value={String(stats.soldTickets)}
          hint={`${checkIn.waiting} giriş bekliyor`}
          icon={Ticket}
          accent="primary"
        />
        <DashboardStatCard
          label="Gelir"
          value={revenueFormatted}
          hint="Ödenen siparişler"
          icon={TrendingUp}
        />
        <DashboardStatCard
          label="Giriş Yapılan"
          value={String(stats.scannedTickets)}
          hint={`%${checkIn.attendancePct} katılım`}
          icon={UserCheck}
          accent="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Giriş özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckInStatsPanel stats={checkIn} showSummary={false} />
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Hızlı işlemler</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="secondary" className="h-11 justify-start font-medium">
              <Link href="/organizator-panel/etkinlikler">Etkinlikleri yönet</Link>
            </Button>
            <Button asChild variant="secondary" className="h-11 justify-start font-medium">
              <Link href="/organizator-panel/siparisler">Satışları görüntüle</Link>
            </Button>
            <Button asChild variant="secondary" className="h-11 justify-start font-medium">
              <Link href="/organizator-panel/biletler">Bilet listesi</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 justify-start font-medium">
              <Link href="/organizator-panel/ayarlar">Ayarlar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
