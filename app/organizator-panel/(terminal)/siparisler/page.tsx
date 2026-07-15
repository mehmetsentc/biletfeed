import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Ticket,
  Users,
  UserCheck,
  UserX,
  MailX
} from 'lucide-react';
import { requireOrganizer } from '@/lib/auth/guards';
import { getOrganizerForSession } from '@/lib/auth/organizer-api';
import {
  getOrganizerOrders,
  getOrganizerEventOptions,
  getOrganizerEventSummary
} from '@/lib/services/organizer-dashboard';
import type { SalesCategoryFilter } from '@/lib/services/ticket-type-category';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventFilterSelect } from '@/components/organizator-panel/orders/event-filter-select';

interface PageProps {
  searchParams: Promise<{ category?: string; eventId?: string }>;
}

function parseCategory(raw?: string): SalesCategoryFilter {
  if (raw === 'ticket' || raw === 'loca') return raw;
  return 'all';
}

const CATEGORY_LABELS: Record<SalesCategoryFilter, string> = {
  all: 'Tümü',
  ticket: 'Bilet Geliri',
  loca: 'Loca Geliri'
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value.toLocaleString('tr-TR')}</p>
      </div>
    </div>
  );
}

export default async function OrganizatorOrdersPage({ searchParams }: PageProps) {
  const session = await requireOrganizer();
  const organizer = await getOrganizerForSession(session.uid);
  if (!organizer) redirect('/organizator-panel/kurulum');

  const { category: categoryParam, eventId } = await searchParams;
  const category = parseCategory(categoryParam);

  const [events, orders, summary] = await Promise.all([
    getOrganizerEventOptions(organizer.id),
    getOrganizerOrders(organizer.id, category, eventId),
    getOrganizerEventSummary(organizer.id, eventId)
  ]);

  const selectedEvent = eventId ? events.find((e) => e.id === eventId) : undefined;
  const pageTitle = selectedEvent ? selectedEvent.title : 'Tüm Siparişler';

  function buildHref(params: { category?: string; eventId?: string }) {
    const p = new URLSearchParams();
    if (params.eventId) p.set('eventId', params.eventId);
    if (params.category && params.category !== 'all') p.set('category', params.category);
    const qs = p.toString();
    return `/organizator-panel/siparisler${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">Satış, giriş ve davetiye özeti</p>
        </div>
        <Suspense fallback={null}>
          <EventFilterSelect events={events} selectedEventId={eventId} />
        </Suspense>
      </div>

      {/* Stats cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={Ticket}
          label="Bilet Satışı"
          value={summary.paidTickets}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Users}
          label="Davetiye"
          value={summary.invitationTickets}
          color="bg-violet-500/10 text-violet-600"
        />
        <StatCard
          icon={UserCheck}
          label="Giriş Yapılanlar"
          value={summary.checkedIn}
          color="bg-green-500/10 text-green-600"
        />
        <StatCard
          icon={UserX}
          label="Satın Alıp Girmeyenler"
          value={summary.paidNotEntered}
          color="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          icon={MailX}
          label="Davetiye Gönderilip Girmeyenler"
          value={summary.invitedNotEntered}
          color="bg-rose-500/10 text-rose-600"
        />
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'ticket', 'loca'] as SalesCategoryFilter[]).map((cat) => (
          <Button
            key={cat}
            asChild
            variant={category === cat ? 'default' : 'outline'}
            size="sm"
          >
            <Link href={buildHref({ category: cat, eventId })}>
              {CATEGORY_LABELS[cat]}
            </Link>
          </Button>
        ))}
      </div>

      {/* Orders table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Tarih</th>
                {!selectedEvent && <th className="p-3 font-medium">Etkinlik</th>}
                <th className="p-3 font-medium">Müşteri</th>
                <th className="p-3 font-medium">Tutar</th>
                <th className="p-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {order.createdAt.toLocaleDateString('tr-TR')}
                  </td>
                  {!selectedEvent && (
                    <td className="p-3 font-medium">{order.event.title}</td>
                  )}
                  <td className="p-3 text-muted-foreground">{order.user.displayName}</td>
                  <td className="p-3 font-semibold">₺{order.total.toLocaleString('tr-TR')}</td>
                  <td className="p-3">
                    <Badge variant={order.status === 'paid' ? 'success' : 'secondary'}>
                      {order.status === 'paid' ? 'Ödendi' : order.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={selectedEvent ? 4 : 5} className="p-10 text-center text-muted-foreground">
                    {selectedEvent
                      ? `"${selectedEvent.title}" için sipariş bulunamadı.`
                      : 'Henüz sipariş yok.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {orders.length > 0 && (
          <div className="border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
            {orders.length} sipariş gösteriliyor
          </div>
        )}
      </div>
    </div>
  );
}
