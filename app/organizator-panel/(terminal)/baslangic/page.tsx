import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerStats } from '@/lib/services/organizer-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ORGANIZATOR_BRAND } from '@/components/organizator-panel/sidebar';

export default async function OrganizatorHomePage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const stats = await getOrganizerStats(organizer.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">Başlangıç</h1>
          <p className="text-sm text-zinc-600">{ORGANIZATOR_BRAND}</p>
        </div>
        <Link href="/organizator-panel/tarayici">
          <Button variant="outline">QR Tarayıcı</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Yaklaşan Etkinlik', value: String(stats.eventCount) },
          { label: 'Satılan Bilet', value: String(stats.soldTickets) },
          { label: 'Gelir', value: `₺${stats.revenue.toLocaleString('tr-TR')}` },
          { label: 'Giriş Yapılan', value: String(stats.scannedTickets) }
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

      <div className="flex flex-wrap gap-3">
        <Link href="/organizator-panel/etkinlikler">
          <Button>Etkinlikleri Yönet</Button>
        </Link>
        <Link href="/organizator-panel/etkinlik/yeni">
          <Button variant="outline">Yeni Etkinlik</Button>
        </Link>
      </div>
    </div>
  );
}
