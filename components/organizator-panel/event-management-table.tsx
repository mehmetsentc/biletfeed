'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Search,
  Ticket
} from 'lucide-react';
import {
  formatEventDate,
  formatEventTime
} from '@/lib/data/mock-events';
import { eventStatusLabel } from '@/lib/organizator/status';
import type { EventStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface OrganizatorEventRow {
  id: string;
  slug: string;
  displayId: string;
  title: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  ticketSold: number;
  ticketCapacity: number;
  venue: { name: string } | null;
  category: { name: string };
}

function statusStyles(label: string): string {
  if (label === 'Yayında') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
  }
  if (label === 'Onay Bekliyor') {
    return 'bg-amber-50 text-amber-800 ring-amber-600/20';
  }
  if (label === 'Taslak') {
    return 'bg-slate-100 text-slate-600 ring-slate-500/15';
  }
  if (label === 'İptal') {
    return 'bg-red-50 text-red-700 ring-red-600/20';
  }
  if (label === 'Eski Etkinlik' || label === 'Tamamlandı') {
    return 'bg-muted text-muted-foreground ring-border';
  }
  return 'bg-muted text-muted-foreground ring-border';
}

function StatusBadge({
  status,
  endDate
}: {
  status: EventStatus;
  endDate: string;
}) {
  const label = eventStatusLabel(status, new Date(endDate));
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        statusStyles(label)
      )}
    >
      {label}
    </span>
  );
}

function TicketProgress({ sold, capacity }: { sold: number; capacity: number }) {
  const pct =
    capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;

  return (
    <div className="min-w-[120px] space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-foreground">
          {sold}
          <span className="font-normal text-muted-foreground">
            {capacity > 0 ? ` / ${capacity}` : ''}
          </span>
        </span>
        {capacity > 0 && (
          <span className="text-muted-foreground">%{pct}</span>
        )}
      </div>
      {capacity > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function EventDateCell({ startDate, endDate }: { startDate: string; endDate: string }) {
  const sameDay =
    formatEventDate(startDate) === formatEventDate(endDate);

  return (
    <div className="space-y-0.5 whitespace-nowrap">
      <p className="font-medium text-foreground">{formatEventDate(startDate)}</p>
      <p className="text-xs text-muted-foreground">
        {formatEventTime(startDate)}
        {!sameDay && (
          <>
            {' '}
            – {formatEventDate(endDate)} {formatEventTime(endDate)}
          </>
        )}
        {sameDay && endDate !== startDate && (
          <> – {formatEventTime(endDate)}</>
        )}
      </p>
    </div>
  );
}

export function EventManagementTable({
  events,
  organizationName
}: {
  events: OrganizatorEventRow[];
  organizationName: string;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.displayId.toLowerCase().includes(q) ||
        e.venue?.name.toLowerCase().includes(q) ||
        e.category.name.toLowerCase().includes(q)
    );
  }, [events, query]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: events.length,
      live: events.filter(
        (e) =>
          e.status === 'published' && new Date(e.endDate) >= now
      ).length,
      draft: events.filter((e) => e.status === 'draft').length
    };
  }, [events]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageEvents = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Başlık */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Organizatör Paneli</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Etkinlikler
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {organizationName} etkinliklerinizi yönetin, satışları takip edin ve
            yeni etkinlik oluşturun.
          </p>
        </div>
        <Link
          href="/organizator-panel/etkinlik/yeni"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Yeni Etkinlik
        </Link>
      </div>

      {/* Özet kartlar */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Toplam', value: stats.total, icon: CalendarDays },
          { label: 'Yayında', value: stats.live, icon: Ticket },
          { label: 'Taslak', value: stats.draft, icon: CalendarDays }
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {item.value}
              </p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Liste kartı */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Tüm etkinlikler
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {filtered.length} kayıt listeleniyor
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Etkinlik, mekan veya ID ara…"
              className="h-10 border-input bg-background pl-9"
            />
          </div>
        </div>

        {/* Masaüstü tablo */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3.5">Etkinlik</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Mekan</th>
                <th className="px-5 py-3.5">Tarih</th>
                <th className="px-5 py-3.5">Bilet</th>
                <th className="px-5 py-3.5">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageEvents.map((event) => (
                <tr
                  key={event.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/etkinlik/${event.slug}`}
                      className="group block max-w-[280px]"
                    >
                      <p className="font-semibold text-foreground transition-colors group-hover:text-primary">
                        {event.title}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {event.displayId}
                      </p>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {event.category.name}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0 text-muted-foreground/70" />
                      {event.venue?.name || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <EventDateCell
                      startDate={event.startDate}
                      endDate={event.endDate}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <TicketProgress
                      sold={event.ticketSold}
                      capacity={event.ticketCapacity}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={event.status} endDate={event.endDate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobil kartlar */}
        <div className="divide-y divide-border lg:hidden">
          {pageEvents.map((event) => (
            <article key={event.id} className="space-y-4 px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/etkinlik/${event.slug}`}
                    className="text-base font-semibold text-foreground hover:text-primary"
                  >
                    {event.title}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {event.displayId} · {event.category.name}
                  </p>
                </div>
                <StatusBadge status={event.status} endDate={event.endDate} />
              </div>

              <div className="grid gap-2 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4 shrink-0 text-primary/80" />
                  {formatEventDate(event.startDate)} ·{' '}
                  {formatEventTime(event.startDate)}
                </p>
                {event.venue?.name && (
                  <p className="inline-flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-primary/80" />
                    {event.venue.name}
                  </p>
                )}
              </div>

              <TicketProgress
                sold={event.ticketSold}
                capacity={event.ticketCapacity}
              />
            </article>
          ))}
        </div>

        {pageEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <CalendarDays className="size-7" />
            </span>
            <p className="mt-4 text-base font-semibold text-foreground">
              Henüz etkinlik yok
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {query
                ? 'Aramanızla eşleşen etkinlik bulunamadı.'
                : 'İlk etkinliğinizi oluşturarak bilet satışına başlayın.'}
            </p>
            {!query && (
              <Link
                href="/organizator-panel/etkinlik/yeni"
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="size-4" />
                Etkinlik Oluştur
              </Link>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-4">
            <p className="text-sm text-muted-foreground">
              Sayfa {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="gap-1 border-border bg-background"
              >
                <ChevronLeft className="size-4" />
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="gap-1 border-border bg-background"
              >
                Sonraki
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
