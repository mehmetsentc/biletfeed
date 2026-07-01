'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Archive,
  CalendarDays,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Link2,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  QrCode,
  Send,
  Share2,
  ShoppingBag,
  Ticket,
  TrendingUp,
  XCircle
} from 'lucide-react';
import type { EventStatus } from '@prisma/client';
import {
  formatEventDate,
  formatEventTime
} from '@/lib/data/mock-events';
import { eventStatusLabel } from '@/lib/organizator/status';
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
    organizerName: string;
    organizerSlug: string;
  };
  stats: {
    ticketSold: number;
    ticketCapacity: number;
    occupancyPct: number;
    emptyPct: number;
    revenue: number;
    subtotal: number;
    commission: number;
    netOrganizer: number;
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

function relativeEventLabel(startIso: string, endIso: string): string {
  const now = Date.now();
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (now > end) return `${timeAgo(endIso).replace(' önce', '')} önce gerçekleşti`;
  if (now < start) {
    const days = Math.ceil((start - now) / 86_400_000);
    return days === 1 ? 'Yarın' : `${days} gün sonra`;
  }
  return 'Devam ediyor';
}

function Widget({
  title,
  children,
  className
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-[var(--shadow-sm)]',
        className
      )}
    >
      <div className="border-b border-border bg-muted/30 px-4 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </div>
  );
}

function CapacityDonut({ soldPct, emptyPct }: { soldPct: number; emptyPct: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const soldOffset = c - (soldPct / 100) * c;

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex size-24 shrink-0 items-center justify-center">
        <svg className="-rotate-90 size-24" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={soldOffset}
            className="stroke-primary"
          />
        </svg>
        <span className="absolute text-lg font-bold tabular-nums text-foreground">%{soldPct}</span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-primary" />
          <span className="text-muted-foreground">Dolu</span>
          <span className="font-semibold text-foreground">%{soldPct}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-muted" />
          <span className="text-muted-foreground">Boş</span>
          <span className="font-semibold text-foreground">%{emptyPct}</span>
        </div>
      </div>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{value}</p>
        <button
          type="button"
          onClick={() => void copy()}
          className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
          aria-label="Kopyala"
        >
          <Copy className="size-3.5" />
        </button>
      </div>
      {copied && <p className="text-[10px] text-primary">Kopyalandı</p>}
    </div>
  );
}

export function EventDetailDashboard({
  data,
  publicUrl,
  organizerUrl
}: {
  data: EventDetailData;
  publicUrl: string;
  organizerUrl: string;
}) {
  const { event, stats, categories, recentTickets } = data;
  const endDate = new Date(event.endDate);
  const startDate = new Date(event.startDate);
  const isPast = endDate < new Date();
  const isUpcoming = startDate > new Date();
  const statusLabel = eventStatusLabel(event.status, endDate);
  const [status, setStatus] = useState(event.status);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const categoryInactive = isPast || status !== 'published';

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

  const alertMessage = useMemo(() => {
    if (isPast) {
      return {
        title: 'Etkinlik gerçekleşti',
        body: 'Bu etkinlik geçmiş bir etkinliktir ve biletlemeye kapalıdır. Raporları ve istatistikleri görüntülemeye devam edebilirsiniz.',
        tone: 'past' as const
      };
    }
    if (status === 'cancelled') {
      return {
        title: 'Etkinlik iptal edildi',
        body: 'Satışlar durduruldu. Mevcut bilet sahipleri bilgilendirilmelidir.',
        tone: 'cancelled' as const
      };
    }
    if (status === 'draft') {
      return {
        title: 'Taslak — yayında değil',
        body: 'Etkinliği yayına alarak bilet satışını başlatabilirsiniz.',
        tone: 'draft' as const
      };
    }
    if (isUpcoming) {
      return {
        title: 'Yaklaşan etkinlik',
        body: 'Bilet satışları aktif. Satışları ve girişleri bu ekrandan takip edin.',
        tone: 'upcoming' as const
      };
    }
    return null;
  }, [isPast, isUpcoming, status]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Üst navigasyon — Biletino tarzı sekme kısayolları */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Link href="/organizator-panel/etkinlikler">
              <ArrowLeft className="size-4" />
              Geri
            </Link>
          </Button>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <Link
            href="/organizator-panel/etkinlikler"
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-4 py-2.5 text-center shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <Archive className="size-5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-foreground">Etkinlikler</span>
          </Link>
          <Link
            href="/organizator-panel/etkinlik/yeni"
            className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-center transition-colors hover:bg-primary/10"
          >
            <Plus className="size-5 text-primary" />
            <span className="text-[11px] font-semibold text-primary">Yeni</span>
          </Link>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          #{event.displayId}
        </Badge>
      </div>

      <p className="text-sm font-medium text-primary">Etkinlik Detayı</p>

      {/* Etkinlik başlık şeridi */}
      <section className="rounded-[var(--radius-card)] border border-border bg-card px-5 py-5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
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
            <h1 className="mt-2 text-xl font-bold uppercase tracking-tight text-foreground md:text-2xl">
              {event.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              <CalendarDays className="mr-1.5 inline size-4 text-primary" />
              {formatEventDate(event.startDate)} {formatEventTime(event.startDate)} · Türkiye Saati
              <span className="ml-2 text-xs text-primary">
                ({relativeEventLabel(event.startDate, event.endDate)})
              </span>
            </p>
            {(event.venue || event.city) && (
              <p className="mt-1 text-sm font-medium text-foreground">
                {event.venue || event.city}
              </p>
            )}
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              Önizleme
            </a>
          </Button>
        </div>
      </section>

      {alertMessage && (
        <div
          className={cn(
            'rounded-[var(--radius-card)] border px-5 py-4 text-sm',
            alertMessage.tone === 'past' && 'border-amber-200 bg-amber-50 text-amber-950',
            alertMessage.tone === 'cancelled' && 'border-red-200 bg-red-50 text-red-900',
            alertMessage.tone === 'draft' && 'border-slate-200 bg-slate-50 text-slate-800',
            alertMessage.tone === 'upcoming' && 'border-primary/20 bg-primary/5 text-foreground'
          )}
        >
          <p className="font-semibold">{alertMessage.title}</p>
          <p className="mt-1 opacity-90">{alertMessage.body}</p>
        </div>
      )}

      {/* 4×2 widget grid — BiletFeed */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Widget title="Etkinlik Kapasitesi">
          <CapacityDonut soldPct={stats.occupancyPct} emptyPct={stats.emptyPct} />
        </Widget>

        <Widget title="Bilet Adedi">
          <p className="text-4xl font-bold tabular-nums text-foreground">{stats.ticketSold}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.ticketCapacity > 0
              ? `${stats.ticketCapacity - stats.ticketSold} kontenjan boş`
              : 'Kapasite tanımlı değil'}
          </p>
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Son biletlemeler
            </p>
            <ul className="mt-2 max-h-28 space-y-2 overflow-y-auto">
              {recentTickets.length === 0 && (
                <li className="text-xs text-muted-foreground">Henüz satış yok.</li>
              )}
              {recentTickets.slice(0, 5).map((t) => (
                <li key={t.id} className="text-xs">
                  <span className="font-medium text-foreground">{t.holderName}</span>
                  <span className="text-muted-foreground"> · {t.ticketType}</span>
                  <span className="float-right text-muted-foreground">{timeAgo(t.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Widget>

        <Widget title="Net Hasılat">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                Sistem üzerinden gelirler
              </p>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {formatTry(stats.revenue)}
              </p>
              <p className="text-xs text-muted-foreground">{stats.orderCount} ödenen sipariş</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Organizatör hakedişi
              </p>
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {formatTry(stats.netOrganizer)}
              </p>
              <p className="text-xs text-muted-foreground">
                Komisyon: {formatTry(stats.commission)}
              </p>
            </div>
            {stats.invitationCount > 0 && (
              <p className="text-xs text-muted-foreground">
                + {stats.invitationCount} davetiye bileti
              </p>
            )}
          </div>
        </Widget>

        <Widget title="Durum Yönetimi">
          {actionError && <p className="mb-2 text-xs text-destructive">{actionError}</p>}
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" size="sm" className="justify-start gap-2">
              <Link href={`/organizator-panel/etkinlik/${event.id}/duzenle`}>
                <Pencil className="size-3.5" />
                Etkinliği düzenle
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start gap-2">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="size-3.5" />
                Etkinliği görüntüle
              </a>
            </Button>
            {status === 'published' && (
              <Button asChild variant="outline" size="sm" className="justify-start gap-2">
                <Link href={`/organizator-panel/davetiyeler?eventId=${event.id}`}>
                  <Send className="size-3.5" />
                  Davetiye oluştur
                </Link>
              </Button>
            )}
            {status === 'published' && !isPast && (
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                disabled={actionLoading}
                onClick={() => updateStatus('draft')}
              >
                <PauseCircle className="size-3.5" />
                Satışları duraklat
              </Button>
            )}
            {status === 'draft' && !isPast && (
              <Button
                size="sm"
                className="justify-start gap-2"
                disabled={actionLoading}
                onClick={() => updateStatus('published')}
              >
                <PlayCircle className="size-3.5" />
                Yayına al
              </Button>
            )}
            {status !== 'cancelled' && !isPast && (
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 text-destructive hover:text-destructive"
                disabled={actionLoading}
                onClick={() => {
                  if (confirm('Etkinliği iptal etmek istediğinize emin misiniz?')) {
                    void updateStatus('cancelled');
                  }
                }}
              >
                <XCircle className="size-3.5" />
                Etkinliği iptal et
              </Button>
            )}
          </div>
        </Widget>

        <Widget title="Etkinlik Linkleri">
          <div className="space-y-3">
            <CopyField label="Etkinlik linki" value={publicUrl.replace(/^https?:\/\//, '')} />
            <CopyField
              label="Organizasyon linki"
              value={organizerUrl.replace(/^https?:\/\//, '')}
            />
            <Button asChild variant="outline" size="sm" className="mt-1 w-full gap-1.5">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" />
                Önizleme
              </a>
            </Button>
          </div>
        </Widget>

        <Widget title="İşlemler">
          <div className="flex flex-col gap-2">
            <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
              <Link href="/organizator-panel/tarayici">
                <QrCode className="size-3.5" />
                Bilet tara
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
              <Link href="/organizator-panel/siparisler">
                <ShoppingBag className="size-3.5" />
                Siparişler
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
              <Link href="/organizator-panel/biletler">
                <Ticket className="size-3.5" />
                Bilet listesi
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
              <Link href="/organizator-panel/kuponlar">
                <TrendingUp className="size-3.5" />
                Kuponlar
              </Link>
            </Button>
          </div>
        </Widget>

        <Widget title="Raporlar">
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" size="sm" className="justify-start gap-2">
              <a href={`/api/organizer/events/${event.id}/export`} download>
                <FileSpreadsheet className="size-3.5" />
                Rapor indir (CSV)
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="justify-start gap-2">
              <a href={`/api/organizer/tickets/export`} download>
                <Download className="size-3.5" />
                Tüm biletler (CSV)
              </a>
            </Button>
          </div>
        </Widget>

        <Widget title="Veri Paylaşımı">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Etkinlik sayfası linkini paylaşarak satış özetini ve etkinlik detaylarını
            görüntületebilirsiniz.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full gap-2"
            onClick={() => void navigator.clipboard.writeText(publicUrl)}
          >
            <Share2 className="size-3.5" />
            Linki kopyala
          </Button>
          <CopyField label="Paylaşım URL" value={publicUrl} />
        </Widget>
      </div>

      {/* Etkinlik içeriği */}
      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Etkinlik içeriği
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {event.description}
        </p>
        {event.venueAddress && (
          <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <Link2 className="mt-0.5 size-3.5 shrink-0" />
            {event.venueAddress}, {event.city}
          </p>
        )}
      </section>

      {/* Kategori tablosu */}
      <section className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-[var(--shadow-sm)]">
        <div className="border-b border-border bg-muted/30 px-5 py-3">
          <h2 className="font-semibold text-foreground">Kategori bilgileri</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3">Kategori adı</th>
                <th className="px-5 py-3">Başlangıç tarihi</th>
                <th className="px-5 py-3">Kapasite</th>
                <th className="px-5 py-3">Doluluk</th>
                <th className="px-5 py-3">Durum</th>
                <th className="px-5 py-3">Standart ücret</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3.5 font-medium text-foreground">{cat.name}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">
                    {formatEventDate(cat.saleStartDate)} {formatEventTime(cat.saleStartDate)}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums">
                    {cat.sold} / {cat.capacity}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex min-w-[120px] items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${cat.occupancyPct}%` }}
                        />
                      </div>
                      <span className="w-9 text-xs tabular-nums">%{cat.occupancyPct}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={categoryInactive || cat.status !== 'active' ? 'secondary' : 'success'}>
                      {categoryInactive || cat.status !== 'active' ? 'İnaktif' : 'Aktif'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 font-medium tabular-nums">
                    {event.isFree || cat.price === 0 ? '—' : formatTry(cat.price)}
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    Bilet kategorisi tanımlı değil.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
