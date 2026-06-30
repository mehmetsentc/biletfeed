'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  MapPin,
  PauseCircle,
  PlayCircle,
  QrCode,
  ShoppingBag,
  Ticket,
  TrendingUp,
  UserCheck,
  XCircle
} from 'lucide-react';
import type { EventStatus } from '@prisma/client';
import {
  formatEventDate,
  formatEventTime
} from '@/lib/data/mock-events';
import { eventStatusLabel } from '@/lib/organizator/status';
import { DashboardStatCard } from '@/components/organizator-panel/dashboard-stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type CategoryRow = {
  id: string;
  name: string;
  price: number;
  sold: number;
  capacity: number;
  occupancyPct: number;
  status: string;
  saleStartDate: string;
  saleEndDate: string;
};

type EventDetailData = {
  event: {
    id: string;
    slug: string;
    title: string;
    description: string;
    shortDescription: string | null;
    coverImage: string;
    startDate: string;
    endDate: string;
    status: EventStatus;
    isFree: boolean;
    city: string;
    venue: string | null;
    venueAddress: string | null;
    category: string;
    displayId: string;
  };
  stats: {
    ticketSold: number;
    ticketCapacity: number;
    occupancyPct: number;
    revenue: number;
    subtotal: number;
    commission: number;
    orderCount: number;
    checkedIn: number;
    invitationCount: number;
    waitingEntry: number;
  };
  categories: CategoryRow[];
  recentOrders: Array<{
    id: string;
    total: number;
    paidAt: string;
    buyerName: string;
    items: Array<{ name: string; quantity: number }>;
  }>;
  recentTickets: Array<{
    id: string;
    code: string;
    holderName: string;
    ticketType: string;
    createdAt: string;
    status: string;
  }>;
};

function formatTry(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0
  }).format(amount);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(1, mins)} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

function CapacityRing({ pct }: { pct: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative flex size-28 items-center justify-center">
      <svg className="-rotate-90 size-28" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-primary transition-all"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold tabular-nums text-foreground">%{pct}</p>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Doluluk</p>
      </div>
    </div>
  );
}

export function EventDetailDashboard({
  data,
  publicUrl
}: {
  data: EventDetailData;
  publicUrl: string;
}) {
  const { event, stats, categories, recentOrders, recentTickets } = data;
  const endDate = new Date(event.endDate);
  const isPast = endDate < new Date();
  const statusLabel = eventStatusLabel(event.status, endDate);
  const [status, setStatus] = useState(event.status);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const attendancePct = useMemo(
    () =>
      stats.ticketSold > 0
        ? Math.round((stats.checkedIn / stats.ticketSold) * 100)
        : 0,
    [stats.checkedIn, stats.ticketSold]
  );

  async function updateStatus(next: EventStatus) {
    setActionLoading(true);
    setActionError(null);
    const res = await fetch(`/api/organizer/events/${event.id}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next })
    });
    const body = (await res.json()) as { error?: string };
    setActionLoading(false);
    if (!res.ok) {
      setActionError(body.error || 'İşlem başarısız');
      return;
    }
    setStatus(next);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link href="/organizator-panel/etkinlikler">
            <ArrowLeft className="size-4" />
            Etkinlikler
          </Link>
        </Button>
        <span className="font-mono text-xs text-muted-foreground">{event.displayId}</span>
      </div>

      {/* Hero */}
      <section className="overflow-hidden rounded-[var(--radius-card)] border bg-card shadow-[var(--shadow-sm)]">
        <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
          <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[200px]">
            <Image
              src={event.coverImage}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="240px"
            />
          </div>
          <div className="flex flex-col justify-between gap-4 p-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{event.category}</Badge>
                <Badge
                  className={cn(
                    statusLabel === 'Yayında' && 'bg-emerald-50 text-emerald-700',
                    (statusLabel === 'Eski Etkinlik' || statusLabel === 'Tamamlandı') &&
                      'bg-muted text-muted-foreground',
                    statusLabel === 'Taslak' && 'bg-slate-100 text-slate-600',
                    statusLabel === 'İptal' && 'bg-red-50 text-red-700'
                  )}
                >
                  {statusLabel}
                </Badge>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {event.title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-primary" />
                  {formatEventDate(event.startDate)} · {formatEventTime(event.startDate)}
                  {' – '}
                  {formatEventDate(event.endDate)} · {formatEventTime(event.endDate)}
                </span>
                {(event.venue || event.city) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-primary" />
                    {[event.venue, event.city].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                  Herkese Açık Sayfa
                </a>
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/organizator-panel/tarayici">
                  <QrCode className="size-3.5" />
                  Bilet Tara
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {isPast && (
        <div className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">Etkinlik gerçekleşti</p>
          <p className="mt-1 text-amber-900/80">
            Bilet satışı kapalıdır; raporlar ve istatistikler görüntülenmeye devam eder.
          </p>
        </div>
      )}

      {/* Özet istatistikler */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Satılan Bilet"
          value={String(stats.ticketSold)}
          hint={
            stats.ticketCapacity > 0
              ? `${stats.ticketCapacity - stats.ticketSold} kontenjan kaldı`
              : undefined
          }
          icon={Ticket}
          accent="primary"
        />
        <DashboardStatCard
          label="Net Hasılat"
          value={formatTry(stats.revenue)}
          hint={`${stats.orderCount}+ ödenen sipariş`}
          icon={TrendingUp}
        />
        <DashboardStatCard
          label="Giriş Yapılan"
          value={String(stats.checkedIn)}
          hint={`%${attendancePct} katılım · ${stats.waitingEntry} bekliyor`}
          icon={UserCheck}
          accent="success"
        />
        <DashboardStatCard
          label="Davetiye"
          value={String(stats.invitationCount)}
          hint="Organizatör davetiyeleri"
          icon={ShoppingBag}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kapasite + son satışlar */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border bg-card p-6 shadow-[var(--shadow-sm)]">
              <CapacityRing pct={stats.occupancyPct} />
              <p className="mt-4 text-center text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{stats.ticketSold}</span>
                {stats.ticketCapacity > 0 && (
                  <>
                    {' / '}
                    <span>{stats.ticketCapacity}</span> bilet
                  </>
                )}
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] border bg-card p-5 shadow-[var(--shadow-sm)]">
              <h2 className="font-semibold text-foreground">Son biletlemeler</h2>
              <ul className="mt-4 space-y-3">
                {recentTickets.length === 0 && (
                  <li className="text-sm text-muted-foreground">Henüz satış yok.</li>
                )}
                {recentTickets.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{t.holderName}</p>
                      <p className="truncate text-xs text-muted-foreground">{t.ticketType}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(t.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Kategori tablosu */}
          <section className="overflow-hidden rounded-[var(--radius-card)] border bg-card shadow-[var(--shadow-sm)]">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold text-foreground">Bilet kategorileri</h2>
              <p className="text-sm text-muted-foreground">Kategori bazında satış ve doluluk</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3">Kategori</th>
                    <th className="px-5 py-3">Ücret</th>
                    <th className="px-5 py-3">Kapasite</th>
                    <th className="px-5 py-3">Doluluk</th>
                    <th className="px-5 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-muted/20">
                      <td className="px-5 py-3.5 font-medium text-foreground">{cat.name}</td>
                      <td className="px-5 py-3.5">
                        {event.isFree || cat.price === 0 ? 'Ücretsiz' : formatTry(cat.price)}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums">
                        {cat.sold} / {cat.capacity}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex min-w-[100px] items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${cat.occupancyPct}%` }}
                            />
                          </div>
                          <span className="w-8 text-xs tabular-nums text-muted-foreground">
                            %{cat.occupancyPct}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={cat.status === 'active' ? 'success' : 'secondary'}>
                          {cat.status === 'active' ? 'Aktif' : 'İnaktif'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                        Bilet kategorisi tanımlı değil.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Yan panel */}
        <div className="space-y-6">
          <div className="rounded-[var(--radius-card)] border bg-card p-5 shadow-[var(--shadow-sm)]">
            <h2 className="font-semibold text-foreground">Durum yönetimi</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Satış durumunu ve yayın ayarlarını yönetin.
            </p>
            {actionError && (
              <p className="mt-3 text-sm text-destructive">{actionError}</p>
            )}
            <div className="mt-4 flex flex-col gap-2">
              {status === 'published' && !isPast && (
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  disabled={actionLoading}
                  onClick={() => updateStatus('draft')}
                >
                  <PauseCircle className="size-4" />
                  Satışları duraklat (taslak)
                </Button>
              )}
              {status === 'draft' && !isPast && (
                <Button
                  className="justify-start gap-2"
                  disabled={actionLoading}
                  onClick={() => updateStatus('published')}
                >
                  <PlayCircle className="size-4" />
                  Yayına al
                </Button>
              )}
              {status !== 'cancelled' && !isPast && (
                <Button
                  variant="outline"
                  className="justify-start gap-2 text-destructive hover:text-destructive"
                  disabled={actionLoading}
                  onClick={() => {
                    if (confirm('Etkinliği iptal etmek istediğinize emin misiniz?')) {
                      void updateStatus('cancelled');
                    }
                  }}
                >
                  <XCircle className="size-4" />
                  Etkinliği iptal et
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border bg-card p-5 shadow-[var(--shadow-sm)]">
            <h2 className="font-semibold text-foreground">Etkinlik içeriği</h2>
            <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-muted-foreground">
              {event.shortDescription || event.description}
            </p>
            {event.venueAddress && (
              <p className="mt-3 text-xs text-muted-foreground">{event.venueAddress}</p>
            )}
          </div>

          <div className="rounded-[var(--radius-card)] border bg-card p-5 shadow-[var(--shadow-sm)]">
            <h2 className="font-semibold text-foreground">Hızlı bağlantılar</h2>
            <div className="mt-3 flex flex-col gap-2">
              <Button asChild variant="secondary" className="h-10 justify-start font-medium">
                <Link href="/organizator-panel/siparisler">Tüm siparişler</Link>
              </Button>
              <Button asChild variant="secondary" className="h-10 justify-start font-medium">
                <Link href="/organizator-panel/biletler">Bilet listesi</Link>
              </Button>
              <Button asChild variant="secondary" className="h-10 justify-start font-medium">
                <Link href="/organizator-panel/kuponlar">Kuponlar</Link>
              </Button>
              <Button asChild variant="outline" className="h-10 justify-start font-medium">
                <a
                  href={`/api/organizer/tickets/export`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Biletleri CSV indir
                </a>
              </Button>
            </div>
          </div>

          {recentOrders.length > 0 && (
            <div className="rounded-[var(--radius-card)] border bg-card p-5 shadow-[var(--shadow-sm)]">
              <h2 className="font-semibold text-foreground">Son siparişler</h2>
              <ul className="mt-4 space-y-3">
                {recentOrders.map((o) => (
                  <li key={o.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{o.buyerName}</p>
                      <p className="text-sm font-semibold tabular-nums text-primary">
                        {formatTry(o.total)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
