import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import { getOrganizerCheckInStats } from '@/lib/services/ticket-admin';
import {
  buildOrganizerTicketsHref,
  getOrganizerTicketEvents,
  getOrganizerTicketTypeFilters,
  resolveOrganizerTicketsFilter
} from '@/lib/services/organizer-ticket-filters';
import { getOrganizerTickets } from '@/lib/services/organizer-dashboard';
import { CheckInStatsPanel } from '@/components/organizator-panel/check-in-stats';
import { OrganizerTicketActions } from '@/components/organizator-panel/organizer-ticket-actions';
import { OrganizerTicketEventFilter } from '@/components/organizator-panel/organizer-ticket-event-filter';
import { OrganizerTicketTypeFilters } from '@/components/organizator-panel/organizer-ticket-type-filters';
import { OrganizerCsvDownloadButton } from '@/components/organizator-panel/organizer-csv-download-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getGirisUrl } from '@/lib/config/domain';

interface PageProps {
  searchParams: Promise<{ event?: string; type?: string; category?: string }>;
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
  const eventId = params.event?.trim() || undefined;
  const rawTypeKey = params.type ?? params.category;

  const events = await getOrganizerTicketEvents(organizer.id);
  const activeEvent = eventId
    ? events.find((event) => event.id === eventId)
    : undefined;

  if (eventId && !activeEvent) {
    redirect('/organizator-panel/biletler');
  }

  const filterOptions = await getOrganizerTicketTypeFilters(organizer.id, eventId);
  const { filter, active } = resolveOrganizerTicketsFilter(rawTypeKey, filterOptions);

  const [tickets, checkInStats] = await Promise.all([
    getOrganizerTickets(organizer.id, filter, eventId),
    getOrganizerCheckInStats(organizer.id, eventId)
  ]);

  const pageTitle = activeEvent
    ? active.kind === 'all'
      ? activeEvent.title
      : active.kind === 'invitation'
        ? `${activeEvent.title} · Davetiyeler`
        : `${activeEvent.title} · ${active.label}`
    : active.kind === 'all'
      ? 'Tüm Biletler'
      : active.kind === 'invitation'
        ? 'Davetiyeler'
        : active.label;

  const csvHref = eventId
    ? `/api/organizer/tickets/export?eventId=${encodeURIComponent(eventId)}`
    : '/api/organizer/tickets/export';
  const csvFilename = activeEvent
    ? `${activeEvent.title.replace(/[^\w\-ğüşıöçĞÜŞİÖÇ]+/gi, '-').slice(0, 40)}-biletler.csv`
    : `biletler-${Date.now()}.csv`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {tickets.length} kayıt · {checkInStats.checkedIn} giriş yapıldı
            {activeEvent && active.kind !== 'all' ? ` · ${active.label} kategorisi` : ''}
            {!activeEvent && events.length > 0
              ? ` · ${events.length} etkinlik`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={getGirisUrl('/tarayici')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>QR Tarayıcı</Button>
          </a>
          <OrganizerCsvDownloadButton
            href={csvHref}
            fallbackFilename={csvFilename}
            label="CSV İndir"
            variant="outline"
            size="default"
            className="justify-center"
          />
        </div>
      </div>

      {events.length > 0 && (
        <OrganizerTicketEventFilter events={events} activeEventId={eventId} />
      )}

      <OrganizerTicketTypeFilters
        options={filterOptions}
        activeKey={active.key}
        eventId={eventId}
      />

      <CheckInStatsPanel stats={checkInStats} />

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted text-left">
            <tr>
              <th className="p-3 font-medium">Kod</th>
              {!activeEvent && <th className="p-3 font-medium">Etkinlik</th>}
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
                {!activeEvent && (
                  <td className="p-3">
                    <Link
                      href={buildOrganizerTicketsHref(ticket.event.id)}
                      className="font-medium text-foreground underline-offset-2 hover:text-[var(--bf-accent-ink)] hover:underline"
                    >
                      {ticket.event.title}
                    </Link>
                  </td>
                )}
                <td className="p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span>{ticketTypeLabel(ticket.ticketType.name)}</span>
                    {ticket.order.paymentProvider === 'invitation' && (
                      <Badge variant="secondary" className="text-[10px]">
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
                <td
                  colSpan={activeEvent ? 5 : 6}
                  className="p-8 text-center text-muted-foreground"
                >
                  {!eventId && events.length > 0
                    ? 'Bu filtrede kayıt yok. Belirli kategoriler için bir etkinlik seçin.'
                    : filterOptions.length <= 1
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
