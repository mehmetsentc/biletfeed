import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, ScanLine } from 'lucide-react';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerSalesStats } from '@/lib/services/organizer-sales-stats';
import { getOrganizerCheckInStats } from '@/lib/services/ticket-admin';
import { CheckInStatsPanel } from '@/components/organizator-panel/check-in-stats';
import { SalesStatsGrid } from '@/components/organizator-panel/sales-stats-grid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function OrganizatorHomePage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const [salesStats, checkIn] = await Promise.all([
    getOrganizerSalesStats(organizer.id),
    getOrganizerCheckInStats(organizer.id)
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Organizatör Paneli</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Satış &amp; Davetiye Özeti
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Bilet ve loca satışları, davetiyeler ve ciro tek ekranda. Kartlara tıklayarak
            detay listelerine gidebilirsiniz.
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

      <SalesStatsGrid initial={salesStats} />

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
              <Link href="/organizator-panel/davetiyeler">Davetiye gönder</Link>
            </Button>
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
