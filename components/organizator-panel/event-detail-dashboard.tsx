'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Archive,
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Link2,
  Loader2,
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
import { Switch } from '@/components/ui/switch';
import { OrganizerCsvDownloadButton } from '@/components/organizator-panel/organizer-csv-download-button';
import { turkeyCalendarDayDiff } from '@/lib/datetime/istanbul';
import { girisHref } from '@/lib/config/domain';
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
  showLowStockBadge: boolean;
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
    const days = turkeyCalendarDayDiff(startIso);
    if (days <= 0) return 'Bugün';
    if (days === 1) return 'Yarın';
    return `${days} gün sonra`;
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
          className="shrink-0 text-muted-foreground transition-colors hover:text-[var(--bf-accent-ink)]"
          aria-label="Kopyala"
        >
          <Copy className="size-3.5" />
        </button>
      </div>
      {copied && <p className="text-[10px] text-[var(--bf-accent-ink)]">Kopyalandı</p>}
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
  // Transfer state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferQuery, setTransferQuery] = useState('');
  const [transferSelected, setTransferSelected] = useState<{ email: string; name: string } | null>(null);
  const [transferSuggestions, setTransferSuggestions] = useState<
    Array<{ id: string; name: string; email: string; logo: string | null }>
  >([]);
  const [transferSearchLoading, setTransferSearchLoading] = useState(false);
  const [transferDropdownOpen, setTransferDropdownOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const transferInputRef = useRef<HTMLInputElement>(null);
  const transferSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lowStockFlags, setLowStockFlags] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, c.showLowStockBadge]))
  );
  const [lowStockToggleLoading, setLowStockToggleLoading] = useState<string | null>(null);

  const categoryInactive = isPast || status !== 'published';

  async function toggleLowStockBadge(ticketTypeId: string, next: boolean) {
    const previous = lowStockFlags[ticketTypeId] ?? false;
    setLowStockFlags((prev) => ({ ...prev, [ticketTypeId]: next }));
    setLowStockToggleLoading(ticketTypeId);
    try {
      const res = await fetch(`/api/organizer/ticket-types/${ticketTypeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showLowStockBadge: next })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Güncellenemedi');
      }
    } catch {
      setLowStockFlags((prev) => ({ ...prev, [ticketTypeId]: previous }));
    } finally {
      setLowStockToggleLoading(null);
    }
  }

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

  function searchOrganizers(q: string) {
    setTransferQuery(q);
    setTransferSelected(null);
    if (transferSearchTimer.current) clearTimeout(transferSearchTimer.current);
    if (q.length < 2) {
      setTransferSuggestions([]);
      setTransferDropdownOpen(false);
      return;
    }
    transferSearchTimer.current = setTimeout(() => {
      setTransferSearchLoading(true);
      fetch(`/api/organizer/search-organizers?q=${encodeURIComponent(q)}`, {
        credentials: 'same-origin'
      })
        .then((r) => r.json())
        .then((data: { results?: typeof transferSuggestions }) => {
          setTransferSuggestions(data.results ?? []);
          setTransferDropdownOpen(true);
        })
        .catch(() => setTransferSuggestions([]))
        .finally(() => setTransferSearchLoading(false));
    }, 280);
  }

  async function handleTransfer() {
    if (!transferSelected) return;
    if (!confirm(`"${transferSelected.name}" organizatörüne devretmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return;
    setTransferLoading(true);
    setTransferError(null);
    setTransferSuccess(null);
    try {
      const res = await fetch(`/api/organizer/events/${event.id}/transfer`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: transferSelected.email })
      });
      const body = await res.json();
      if (!res.ok) {
        setTransferError(body.error || 'Transfer başarısız');
        return;
      }
      setTransferSuccess(
        `Etkinlik "${body.targetOrganizer.name}" organizatörüne devredildi. (${body.transferred} etkinlik)`
      );
      setTransferQuery('');
      setTransferSelected(null);
      setTransferOpen(false);
    } catch {
      setTransferError('Bir hata oluştu.');
    } finally {
      setTransferLoading(false);
    }
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
        body: 'Etkinliği onaya göndererek yayın sürecini başlatabilirsiniz.',
        tone: 'draft' as const
      };
    }
    if (status === 'pending') {
      return {
        title: 'Onay bekliyor',
        body: 'Etkinliğiniz BiletFeed ekibi tarafından inceleniyor. Onaylandığında otomatik olarak yayına alınacaktır.',
        tone: 'pending' as const
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
            <Plus className="size-5 text-[var(--bf-accent-ink)]" />
            <span className="text-[11px] font-semibold text-[var(--bf-accent-ink)]">Yeni</span>
          </Link>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          #{event.displayId}
        </Badge>
      </div>

      <p className="text-sm font-medium text-[var(--bf-accent-ink)]">Etkinlik Detayı</p>

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
                  statusLabel === 'Onay Bekliyor' && 'bg-amber-50 text-amber-800',
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
              <CalendarDays className="mr-1.5 inline size-4 text-[var(--bf-accent-ink)]" />
              {formatEventDate(event.startDate)} {formatEventTime(event.startDate)} · Türkiye Saati
              <span className="ml-2 text-xs text-[var(--bf-accent-ink)]">
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
            alertMessage.tone === 'pending' && 'border-amber-200 bg-amber-50 text-amber-950',
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
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--bf-accent-ink)]">
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
                onClick={() => updateStatus('pending')}
              >
                <PlayCircle className="size-3.5" />
                Onaya Gönder
              </Button>
            )}
            {status === 'pending' && !isPast && (
              <p className="text-xs text-muted-foreground">
                Etkinlik admin onayı bekliyor.
              </p>
            )}
            {/* Transfer */}
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={() => {
                setTransferOpen((o) => !o);
                setTransferError(null);
                setTransferQuery('');
                setTransferSelected(null);
                setTransferSuggestions([]);
                setTimeout(() => transferInputRef.current?.focus(), 50);
              }}
            >
              <ArrowRightLeft className="size-3.5" />
              Etkinliği devret
            </Button>
            {transferOpen && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-xs text-muted-foreground leading-snug">
                  Organizatör adı veya e-posta ile arayın. Etkinlik ve tüm seans etkinlikleri devredilir.
                </p>
                {/* Arama alanı + dropdown */}
                <div className="relative">
                  <input
                    ref={transferInputRef}
                    type="text"
                    autoComplete="off"
                    value={transferQuery}
                    onChange={(e) => searchOrganizers(e.target.value)}
                    placeholder="Organizatör adı veya e-posta..."
                    className="w-full h-8 rounded-md border border-border bg-background px-2.5 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setTransferDropdownOpen(false);
                        setTransferOpen(false);
                      }
                    }}
                    onBlur={() => {
                      // Dropdown'dan seçim yapılabilmesi için kısa gecikme
                      setTimeout(() => setTransferDropdownOpen(false), 150);
                    }}
                  />
                  {transferSearchLoading && (
                    <Loader2 className="absolute right-2.5 top-2 size-4 animate-spin text-muted-foreground" />
                  )}
                  {/* Sonuç listesi */}
                  {transferDropdownOpen && transferSuggestions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg overflow-hidden">
                      {transferSuggestions.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/60 transition-colors text-sm"
                          onMouseDown={(e) => e.preventDefault()} // blur'u engelle
                          onClick={() => {
                            setTransferSelected({ email: org.email, name: org.name });
                            setTransferQuery(org.name);
                            setTransferDropdownOpen(false);
                          }}
                        >
                          {org.logo ? (
                            <img
                              src={org.logo}
                              alt=""
                              className="size-7 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="size-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-[var(--bf-accent-ink)] font-semibold text-xs">
                              {org.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{org.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{org.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {transferDropdownOpen &&
                    !transferSearchLoading &&
                    transferSuggestions.length === 0 &&
                    transferQuery.length >= 2 && (
                      <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg px-3 py-2 text-xs text-muted-foreground">
                        Eşleşen onaylı organizatör bulunamadı
                      </div>
                    )}
                </div>
                {/* Seçili organizatör etiketi */}
                {transferSelected && (
                  <div className="flex items-center gap-2 rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-xs">
                    <CheckCircle2 className="size-3.5 text-[var(--bf-accent-ink)] shrink-0" />
                    <span className="font-medium">{transferSelected.name}</span>
                    <span className="text-muted-foreground truncate">({transferSelected.email})</span>
                  </div>
                )}
                {transferError && (
                  <p className="text-xs text-destructive">{transferError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs gap-1.5"
                    disabled={transferLoading || !transferSelected}
                    onClick={() => void handleTransfer()}
                  >
                    {transferLoading ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <ArrowRightLeft className="size-3" />
                    )}
                    Devret
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      setTransferOpen(false);
                      setTransferQuery('');
                      setTransferSelected(null);
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            )}
            {transferSuccess && (
              <p className="text-xs text-green-600 font-medium">{transferSuccess}</p>
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
              <a
                href={girisHref('/tarayici')}
                target="_blank"
                rel="noopener noreferrer"
              >
                <QrCode className="size-3.5" />
                Bilet tara
              </a>
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
            <OrganizerCsvDownloadButton
              href={`/api/organizer/events/${event.id}/export`}
              fallbackFilename={`${event.slug}-rapor.csv`}
              label="Rapor indir (CSV)"
              icon={FileSpreadsheet}
            />
            <OrganizerCsvDownloadButton
              href={`/api/organizer/tickets/export?eventId=${encodeURIComponent(event.id)}`}
              fallbackFilename={`${event.slug}-biletler.csv`}
              label="Tüm biletler (CSV)"
              icon={Download}
            />
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
                <th className="px-5 py-3">Tükenmek üzere</th>
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
                  <td className="px-5 py-3.5">
                    <Switch
                      checked={lowStockFlags[cat.id] ?? false}
                      disabled={lowStockToggleLoading === cat.id}
                      onCheckedChange={(checked) => void toggleLowStockBadge(cat.id, checked)}
                      aria-label={`${cat.name} için tükenmek üzere rozeti`}
                    />
                  </td>
                  <td className="px-5 py-3.5 font-medium tabular-nums">
                    {event.isFree || cat.price === 0 ? '—' : formatTry(cat.price)}
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
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
