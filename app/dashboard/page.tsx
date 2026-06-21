import Link from 'next/link';
import { getTranslations } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerStats } from '@/lib/services/organizer-dashboard';

const t = getTranslations();

export default async function DashboardPage() {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{t.dashboard.title}</h1>
        <p className="text-muted-foreground">
          Organizatör profiliniz henüz oluşturulmamış. Etkinlik oluşturarak başlayın.
        </p>
        <Link href="/dashboard/etkinlik/yeni">
          <Button>Etkinlik Oluştur</Button>
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
    </div>
  );
}
