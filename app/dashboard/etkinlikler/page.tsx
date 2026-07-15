import Link from 'next/link';
import Image from 'next/image';
import { formatEventDate } from '@/lib/data/mock-events';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerEvents } from '@/lib/services/organizer-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function DashboardEventsPage() {
  const { t } = await getServerTranslations();
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) {
    return <p className="text-muted-foreground">Organizatör profili bulunamadı.</p>;
  }

  const events = await getOrganizerEvents(organizer.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.dashboard.events}</h1>
          <p className="text-muted-foreground">Etkinliklerinizi yönetin</p>
        </div>
        <Link href="/dashboard/etkinlik/yeni">
          <Button>Yeni Etkinlik</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Tarih</th>
              <th className="p-3 font-medium">Şehir</th>
              <th className="p-3 font-medium">Bilet</th>
              <th className="p-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                      <Image src={event.coverImage} alt="" fill className="object-cover" unoptimized />
                    </div>
                    <span className="font-medium line-clamp-1">{event.title}</span>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap text-muted-foreground">
                  {formatEventDate(event.startDate.toISOString())}
                </td>
                <td className="p-3">{event.city.name}</td>
                <td className="p-3">{event._count.purchasedTickets}</td>
                <td className="p-3">
                  <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                    {event.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Henüz etkinlik yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
