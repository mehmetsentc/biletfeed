import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerStats } from '@/lib/services/organizer-dashboard';
import { getOrganizerCheckInStats } from '@/lib/services/ticket-admin';
import {
  getOrganizerTicketTypeFilters,
  resolveOrganizerTicketsFilter
} from '@/lib/services/organizer-ticket-filters';
import { getOrganizerTickets } from '@/lib/services/organizer-dashboard';
import { CheckInStatsPanel } from '@/components/organizator-panel/check-in-stats';
import { OrganizerTicketActions } from '@/components/organizator-panel/organizer-ticket-actions';
import { OrganizerTicketTypeFilters } from '@/components/organizator-panel/organizer-ticket-type-filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PageProps {
  searchParams: Promise<{ type?: string; category?: string }>;
}

function ticketTypeLabel(name: string): string {
  const sep = ' — ';
  const idx = name.indexOf(sep);
  return idx >= 0 ? name.slice(0, idx).trim() : name.trim();
}

export default async function OrganizatorTicketsPage({ searchParams }: PageProps) {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid, session.email);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const params = await searchParams;
  const filterOptions = await getOrganizerTicketTypeFilters(organizer.id);
  const rawKey = params.type ?? params.category;
  const { filter, active } = resolveOrganizerTicketsFilter(rawKey, filterOptions);

  const [tickets, stats, checkInStats] = await Promise.all([
    getOrganizerTickets(organizer.id, filter),
    getOrganizerStats(organizer.id),
    getOrganizerCheckInStats(organizer.id)
  ]);

  const pageTitle =
    active.kind === 'all'
      ? 'Tüm Biletler'
      : active.kind === 'invitation'
        ? 'Davetiyeler'
        : active.label;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {tickets.length} kayıt · {stats.scannedTickets} giriş yapıldı
            {active.kind !== 'all' ? ` · ${active.label} kategorisi` : ''}
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

      <OrganizerTicketTypeFilters options={filterOptions} activeKey={active.key} />

      <CheckInStatsPanel stats={checkInStats} />

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted text-left">
            <tr>
              <th className="p-3 font-medium">Kod</th>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Kategori</th>
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
                <td className="p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span>{ticketTypeLabel(ticket.ticketType.name)}</span>
                    {ticket.order.paymentProvider === 'invitation' && (
                      <Badge variant="outline" className="text-[10px]">
                        Davetiye
                      </Badge>
                    )}
                  </div>
                </td>
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
                  {filterOptions.length <= 1
                    ? 'Henüz bilet veya davetiye kaydı yok.'
                    : `${active.label} kategorisinde kayıt bulunamadı.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
