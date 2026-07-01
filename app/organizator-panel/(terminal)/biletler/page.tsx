import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import {
  getOrganizerTickets,
  getOrganizerStats
} from '@/lib/services/organizer-dashboard';
import { getOrganizerCheckInStats } from '@/lib/services/ticket-admin';
import type { SalesCategoryFilter } from '@/lib/services/ticket-type-category';
import { CheckInStatsPanel } from '@/components/organizator-panel/check-in-stats';
import { OrganizerTicketActions } from '@/components/organizator-panel/organizer-ticket-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

function parseCategory(raw?: string): SalesCategoryFilter {
  if (raw === 'ticket' || raw === 'loca') return raw;
  return 'all';
}

const CATEGORY_LABELS: Record<SalesCategoryFilter, string> = {
  all: 'Tüm Biletler',
  ticket: 'Satılan Biletler',
  loca: 'Satılan Localar'
};

export default async function OrganizatorTicketsPage({ searchParams }: PageProps) {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const { category: categoryParam } = await searchParams;
  const category = parseCategory(categoryParam);

  const [tickets, stats, checkInStats] = await Promise.all([
    getOrganizerTickets(organizer.id, category),
    getOrganizerStats(organizer.id),
    getOrganizerCheckInStats(organizer.id)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{CATEGORY_LABELS[category]}</h1>
          <p className="text-sm text-muted-foreground">
            {tickets.length} kayıt · {stats.scannedTickets} giriş yapıldı
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/organizator-panel/tarayici">
            <Button>QR Tarayıcı</Button>
          </Link>
          <Button variant="outline" asChild>
            <a href="/api/organizer/tickets/export">CSV İndir</a>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={category === 'all' ? 'default' : 'outline'} size="sm">
          <Link href="/organizator-panel/biletler">Tümü</Link>
        </Button>
        <Button asChild variant={category === 'ticket' ? 'default' : 'outline'} size="sm">
          <Link href="/organizator-panel/biletler?category=ticket">Bilet</Link>
        </Button>
        <Button asChild variant={category === 'loca' ? 'default' : 'outline'} size="sm">
          <Link href="/organizator-panel/biletler?category=loca">Loca</Link>
        </Button>
      </div>

      <CheckInStatsPanel stats={checkInStats} />

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted text-left">
            <tr>
              <th className="p-3 font-medium">Kod</th>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Tür</th>
              <th className="p-3 font-medium">Sahip</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b last:border-0">
                <td className="p-3 font-mono text-xs">{ticket.ticketCode}</td>
                <td className="p-3">{ticket.event.title}</td>
                <td className="p-3">{ticket.ticketType.name}</td>
                <td className="p-3">{ticket.user.displayName}</td>
                <td className="p-3">
                  <Badge variant={ticket.status === 'USED' ? 'success' : 'secondary'}>
                    {ticket.status}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <OrganizerTicketActions
                    ticketId={ticket.id}
                    ticketCode={ticket.ticketCode}
                    status={ticket.status}
                  />
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Bu kategoride bilet bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
