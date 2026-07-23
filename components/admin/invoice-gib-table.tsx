'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ban,
  Eye,
  FileDown,
  RefreshCw,
  Search,
  Send,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GibErrorCategory } from '@/lib/accounting/einvoice/gib-errors';
import type { InvoiceLifecycleStatus } from '@/lib/accounting/einvoice/lifecycle';
import {
  LIFECYCLE_LABELS,
  lifecycleBadgeVariant
} from '@/lib/accounting/einvoice/lifecycle';

export type InvoiceDocumentTypeChoice = 'e_arsiv' | 'e_fatura';

export type InvoiceGibLine = {
  description: string;
  quantity: number;
  unitPriceNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
};

export type InvoiceGibRow = {
  id: string;
  invoiceNumber: string;
  issuedAtLabel: string;
  /** date input için YYYY-MM-DD */
  issuedAtDate: string;
  buyerName: string;
  buyerTaxNumber: string | null;
  eventTitle: string;
  amountLabel: string;
  type: string;
  suggestedType: InvoiceDocumentTypeChoice;
  status: string;
  gibStatus: string;
  lifecycle: InvoiceLifecycleStatus;
  needsSmsSign: boolean;
  eInvoiceUuid: string | null;
  ettn: string | null;
  envelopeUuid: string | null;
  lastError: string | null;
  phoneMasked: string | null;
  errorCategory: GibErrorCategory | null;
  errorTitle: string | null;
  errorExplanation: string | null;
  sendDisabled: boolean;
  sendDisabledReason: string | null;
  canEditIssuedAt: boolean;
  canEditDocumentType: boolean;
  issuedOutsideGecis: boolean;
  gecisRangeLabel: string | null;
  isRetry: boolean;
  channelLabel: string | null;
  channelId: string | null;
  efaturaChannelReady: boolean;
  mock: boolean;
  isCreditNote: boolean;
  originalInvoiceNumber: string | null;
  subtotalNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
  currency: string;
  lines: InvoiceGibLine[];
};

function typeLabel(t: string): string {
  if (t === 'e_fatura') return 'e-Fatura';
  if (t === 'e_arsiv') return 'e-Arşiv';
  if (t === 'credit_note') return 'İade';
  return t;
}

function money(n: number, currency = 'TRY') {
  const prefix = currency === 'TRY' ? '₺' : `${currency} `;
  return `${prefix}${n.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
}

type DetailState = {
  loading: boolean;
  error: string | null;
  data: Record<string, unknown> | null;
};

export function InvoiceGibTable({ rows }: { rows: InvoiceGibRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [info, setInfo] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const [types, setTypes] = useState<Record<string, InvoiceDocumentTypeChoice>>(
    {}
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLifecycle, setFilterLifecycle] = useState<string>('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailState>({
    loading: false,
    error: null,
    data: null
  });

  const typeById = useMemo(() => {
    const map: Record<string, InvoiceDocumentTypeChoice> = {};
    for (const row of rows) {
      if (row.type === 'e_fatura' || row.type === 'e_arsiv') {
        map[row.id] = row.type;
      }
    }
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filterType !== 'all' && row.type !== filterType) return false;
      if (filterLifecycle !== 'all' && row.lifecycle !== filterLifecycle) {
        return false;
      }
      if (filterFrom && row.issuedAtDate < filterFrom) return false;
      if (filterTo && row.issuedAtDate > filterTo) return false;
      if (q) {
        const hay = [
          row.invoiceNumber,
          row.buyerName,
          row.buyerTaxNumber ?? '',
          row.eInvoiceUuid ?? '',
          row.eventTitle
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filterType, filterLifecycle, filterFrom, filterTo, search]);

  function currentType(row: InvoiceGibRow): InvoiceDocumentTypeChoice {
    return types[row.id] ?? typeById[row.id] ?? 'e_arsiv';
  }

  async function post(
    invoiceId: string,
    path: string,
    body?: Record<string, unknown>,
    method: 'POST' | 'PATCH' = 'POST'
  ) {
    setBusyId(invoiceId);
    setErrors((p) => ({ ...p, [invoiceId]: '' }));
    try {
      const res = await fetch(
        `/api/admin/accounting/invoices/${invoiceId}/${path}`,
        {
          method,
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined
        }
      );
      const data = (await res.json()) as {
        error?: string;
        phoneMasked?: string;
        oid?: string;
        channelLabel?: string;
        suggestedDocumentType?: string;
        note?: string;
      };
      if (!res.ok) {
        setErrors((p) => ({
          ...p,
          [invoiceId]: data.error || 'İşlem başarısız'
        }));
        return;
      }
      if (path === 'sms-start' && data.phoneMasked) {
        setInfo((p) => ({
          ...p,
          [invoiceId]: `SMS gönderildi (${data.phoneMasked})`
        }));
      }
      if (path === 'issued-at') {
        setInfo((p) => ({
          ...p,
          [invoiceId]: 'Fatura tarihi güncellendi'
        }));
      }
      if (path === 'document-type') {
        setInfo((p) => ({
          ...p,
          [invoiceId]: 'Belge tipi kaydedildi'
        }));
      }
      if (path === 'submit-einvoice' && data.channelLabel) {
        setInfo((p) => ({
          ...p,
          [invoiceId]: `Gönderildi → ${data.channelLabel}`
        }));
      }
      if (path === 'cancel') {
        setInfo((p) => ({ ...p, [invoiceId]: 'Fatura iptal edildi' }));
      }
      if (path === 'taxpayer-check') {
        setInfo((p) => ({
          ...p,
          [invoiceId]:
            data.note ||
            `Öneri: ${typeLabel(data.suggestedDocumentType ?? '')}`
        }));
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function downloadPdf(row: InvoiceGibRow) {
    setBusyId(row.id);
    setErrors((p) => ({ ...p, [row.id]: '' }));
    try {
      const res = await fetch(
        `/api/admin/accounting/invoices/${row.id}/pdf`,
        { credentials: 'same-origin' }
      );
      const ct = res.headers.get('content-type') ?? '';
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErrors((p) => ({
          ...p,
          [row.id]: data.error || 'PDF indirilemedi'
        }));
        return;
      }
      if (ct.includes('application/json')) {
        const data = (await res.json()) as {
          pdfUrl?: string;
          source?: string;
        };
        if (data.pdfUrl) {
          window.open(data.pdfUrl, '_blank', 'noopener,noreferrer');
          setInfo((p) => ({
            ...p,
            [row.id]: 'GİB portal PDF linki açıldı'
          }));
          return;
        }
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BiletFeed-Fatura-${row.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setInfo((p) => ({ ...p, [row.id]: 'PDF indirildi' }));
    } finally {
      setBusyId(null);
    }
  }

  async function openDetail(row: InvoiceGibRow) {
    setDetailId(row.id);
    setDetail({ loading: true, error: null, data: null });
    try {
      const res = await fetch(`/api/admin/accounting/invoices/${row.id}`, {
        credentials: 'same-origin'
      });
      const data = (await res.json()) as Record<string, unknown> & {
        error?: string;
      };
      if (!res.ok) {
        setDetail({
          loading: false,
          error: data.error || 'Detay yüklenemedi',
          data: null
        });
        return;
      }
      setDetail({ loading: false, error: null, data });
    } catch {
      setDetail({ loading: false, error: 'Detay yüklenemedi', data: null });
    }
  }

  function saveType(row: InvoiceGibRow, next: InvoiceDocumentTypeChoice) {
    const suggested = row.suggestedType;
    if (next !== suggested) {
      const ok = window.confirm(
        `Önerilen tip: ${typeLabel(suggested)} (VKN/TCKN’ye göre).\n` +
          `Seçiminiz: ${typeLabel(next)}.\n\n` +
          `Farklı belge tipi ile devam etmek istediğinize emin misiniz?`
      );
      if (!ok) {
        setTypes((p) => ({
          ...p,
          [row.id]: row.type as InvoiceDocumentTypeChoice
        }));
        return;
      }
    }
    setTypes((p) => ({ ...p, [row.id]: next }));
    void post(row.id, 'document-type', { type: next, overrideConfirmed: true }, 'PATCH');
  }

  function confirmCancel(row: InvoiceGibRow) {
    const ok = window.confirm(
      `${row.invoiceNumber} iptal edilsin mi?\n` +
        (row.type === 'e_arsiv'
          ? 'e-Arşiv: taslak silinir veya imzalıysa portal iptali denenir (7 gün kuralı).'
          : row.type === 'e_fatura'
            ? 'e-Fatura: kanal iptali (mock’ta yerel işaret).'
            : 'İade kaydı iptal edilecek.')
    );
    if (!ok) return;
    void post(row.id, 'cancel', { reason: 'admin_panel' });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Henüz fatura yok.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/20 p-3">
        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase text-muted-foreground">
            Tip
          </label>
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tümü</option>
            <option value="e_arsiv">e-Arşiv</option>
            <option value="e_fatura">e-Fatura</option>
            <option value="credit_note">İade</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase text-muted-foreground">
            Durum
          </label>
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={filterLifecycle}
            onChange={(e) => setFilterLifecycle(e.target.value)}
          >
            <option value="all">Tümü</option>
            {(Object.keys(LIFECYCLE_LABELS) as InvoiceLifecycleStatus[]).map(
              (k) => (
                <option key={k} value={k}>
                  {LIFECYCLE_LABELS[k]}
                </option>
              )
            )}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase text-muted-foreground">
            Başlangıç
          </label>
          <Input
            type="date"
            className="h-8 w-[140px]"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-medium uppercase text-muted-foreground">
            Bitiş
          </label>
          <Input
            type="date"
            className="h-8 w-[140px]"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
        </div>
        <div className="min-w-[200px] flex-1 space-y-1">
          <label className="text-[10px] font-medium uppercase text-muted-foreground">
            Ara (alıcı / no / ETTN)
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-2 size-3.5 text-muted-foreground" />
            <Input
              className="h-8 pl-7 text-xs"
              placeholder="BF2026… veya alıcı"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <p className="pb-1 text-xs text-muted-foreground">
          {filtered.length} / {rows.length}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[1280px] text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">No / ETTN</th>
              <th className="p-3 font-medium">Tarih</th>
              <th className="p-3 font-medium">Alıcı</th>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Tutar</th>
              <th className="p-3 font-medium">Belge / kanal</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const lifecycleVariant = lifecycleBadgeVariant(row.lifecycle);
              const dateValue = dates[row.id] ?? row.issuedAtDate;
              const sendLabel = row.isRetry ? 'Tekrar dene' : 'Gönder';
              const docType = currentType(row);
              const isEfatura = docType === 'e_fatura';
              const isCredit = row.isCreditNote;
              const channelHint = isCredit
                ? 'İade → tip/orijinale göre kanal'
                : isEfatura
                  ? row.efaturaChannelReady
                    ? 'Kanal: BiletFeed e-Fatura'
                    : 'Kanal yapılandırılmadı'
                  : 'Kanal: GİB e-Arşiv portal';
              const sendBlocked =
                row.status === 'cancelled' ||
                row.lifecycle === 'iptal' ||
                row.sendDisabled ||
                (isEfatura && !row.efaturaChannelReady && !isCredit);

              return (
                <tr key={row.id} className="border-b last:border-0 align-top">
                  <td className="p-3">
                    <button
                      type="button"
                      className="font-medium text-left hover:underline"
                      onClick={() => void openDetail(row)}
                    >
                      {row.invoiceNumber}
                    </button>
                    {row.originalInvoiceNumber && (
                      <p className="text-[10px] text-muted-foreground">
                        İade ← {row.originalInvoiceNumber}
                      </p>
                    )}
                    {(row.eInvoiceUuid || row.ettn) && (
                      <p
                        className="mt-1 max-w-[160px] truncate font-mono text-[10px] text-muted-foreground"
                        title={row.eInvoiceUuid ?? row.ettn ?? ''}
                      >
                        ETTN: {(row.eInvoiceUuid ?? row.ettn)?.slice(0, 13)}…
                      </p>
                    )}
                    {row.envelopeUuid && (
                      <p
                        className="max-w-[160px] truncate font-mono text-[10px] text-zinc-400"
                        title={row.envelopeUuid}
                      >
                        Zarf: {row.envelopeUuid.slice(0, 8)}…
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="space-y-1.5">
                      <span>{row.issuedAtLabel}</span>
                      {row.canEditIssuedAt && (
                        <div className="flex flex-col gap-1">
                          <Input
                            type="date"
                            className="h-8 w-[150px]"
                            value={dateValue}
                            onChange={(e) =>
                              setDates((p) => ({
                                ...p,
                                [row.id]: e.target.value
                              }))
                            }
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 w-fit px-2 text-xs"
                            disabled={
                              busyId === row.id ||
                              !dateValue ||
                              dateValue === row.issuedAtDate
                            }
                            onClick={() => {
                              const iso = `${dateValue}T12:00:00.000Z`;
                              void post(row.id, 'issued-at', { issuedAt: iso }, 'PATCH');
                            }}
                          >
                            Tarihi kaydet
                          </Button>
                        </div>
                      )}
                      {row.issuedOutsideGecis && row.gecisRangeLabel && (
                        <p className="max-w-[160px] text-[10px] text-amber-700">
                          GEÇİŞ dışı (izinli: {row.gecisRangeLabel})
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div>{row.buyerName}</div>
                    {row.buyerTaxNumber && (
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {row.buyerTaxNumber}
                      </p>
                    )}
                  </td>
                  <td className="p-3">{row.eventTitle}</td>
                  <td className="p-3 whitespace-nowrap">{row.amountLabel}</td>
                  <td className="p-3">
                    <div className="space-y-1.5">
                      {row.canEditDocumentType &&
                      (row.type === 'e_arsiv' || row.type === 'e_fatura') ? (
                        <select
                          className="h-8 w-full max-w-[160px] rounded-md border border-input bg-background px-2 text-xs"
                          value={docType}
                          disabled={busyId === row.id}
                          onChange={(e) => {
                            const next = e.target
                              .value as InvoiceDocumentTypeChoice;
                            saveType(row, next);
                          }}
                        >
                          <option value="e_arsiv">e-Arşiv</option>
                          <option value="e_fatura">e-Fatura</option>
                        </select>
                      ) : (
                        <span className="text-xs font-medium">
                          {typeLabel(row.type)}
                        </span>
                      )}
                      {!isCredit && (
                        <p className="text-[10px] text-muted-foreground">
                          Öneri: {typeLabel(row.suggestedType)}
                        </p>
                      )}
                      <p
                        className={
                          isEfatura && !row.efaturaChannelReady
                            ? 'text-[10px] font-medium text-amber-800'
                            : 'text-[10px] text-muted-foreground'
                        }
                      >
                        {channelHint}
                      </p>
                      {row.channelLabel && (
                        <p className="text-[10px] text-zinc-500">
                          Son: {row.channelLabel}
                          {row.mock ? ' (mock)' : ''}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={lifecycleVariant}>
                      {LIFECYCLE_LABELS[row.lifecycle]}
                    </Badge>
                    {row.errorTitle && (
                      <div className="mt-1.5 max-w-[220px] space-y-0.5">
                        <p className="text-[11px] font-medium text-destructive">
                          {row.errorTitle}
                        </p>
                        {row.errorExplanation && (
                          <p className="text-[11px] leading-snug text-muted-foreground">
                            {row.errorExplanation}
                          </p>
                        )}
                      </div>
                    )}
                    {!row.errorTitle && row.lastError && (
                      <p className="mt-1 max-w-[180px] text-[11px] text-destructive">
                        {row.lastError}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex min-w-[240px] flex-col gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 px-2"
                          disabled={busyId === row.id}
                          onClick={() => void openDetail(row)}
                        >
                          <Eye className="size-3.5" />
                          Detay
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 px-2"
                          disabled={busyId === row.id}
                          onClick={() => void downloadPdf(row)}
                        >
                          <FileDown className="size-3.5" />
                          PDF
                        </Button>
                        {!isCredit && row.status !== 'cancelled' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 px-2"
                            disabled={busyId === row.id || sendBlocked}
                            title={
                              sendBlocked
                                ? (row.sendDisabledReason ??
                                  (isEfatura && !row.efaturaChannelReady
                                    ? 'e-Fatura kanalı yapılandırılmadı'
                                    : undefined))
                                : undefined
                            }
                            onClick={() =>
                              void post(row.id, 'submit-einvoice', {
                                force: true,
                                documentType: docType,
                                overrideConfirmed: true
                              })
                            }
                          >
                            <RefreshCw className="size-3.5" />
                            {sendLabel}
                          </Button>
                        )}
                        {isCredit && row.status !== 'cancelled' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 px-2"
                            disabled={busyId === row.id}
                            onClick={() =>
                              void post(row.id, 'submit-einvoice', {
                                force: true
                              })
                            }
                          >
                            <RefreshCw className="size-3.5" />
                            İade gönder
                          </Button>
                        )}
                        {row.status !== 'cancelled' &&
                          row.lifecycle !== 'iptal' && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 px-2 text-destructive"
                              disabled={busyId === row.id}
                              onClick={() => confirmCancel(row)}
                            >
                              <Ban className="size-3.5" />
                              İptal
                            </Button>
                          )}
                      </div>

                      {!isCredit && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 w-fit px-2 text-[11px]"
                          disabled={busyId === row.id}
                          onClick={() =>
                            void post(row.id, 'taxpayer-check', { force: true })
                          }
                        >
                          Mükellef kontrol
                        </Button>
                      )}

                      {sendBlocked && row.status !== 'cancelled' && (
                        <p className="text-[11px] leading-snug text-amber-800">
                          {row.sendDisabledReason ??
                            (isEfatura && !row.efaturaChannelReady
                              ? 'e-Fatura gönderimi için entegratör/kanal yapılandırılmadı'
                              : null)}
                        </p>
                      )}

                      {(row.needsSmsSign || row.lifecycle === 'sms_bekliyor') &&
                        !isEfatura &&
                        row.status !== 'cancelled' && (
                          <div className="space-y-1.5 rounded-md border bg-muted/30 p-2">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 w-full gap-1"
                              disabled={busyId === row.id}
                              onClick={() => void post(row.id, 'sms-start')}
                            >
                              <Send className="size-3.5" />
                              SMS gönder
                              {row.phoneMasked ? ` (${row.phoneMasked})` : ''}
                            </Button>
                            <div className="flex gap-1.5">
                              <Input
                                value={codes[row.id] ?? ''}
                                onChange={(e) =>
                                  setCodes((p) => ({
                                    ...p,
                                    [row.id]: e.target.value
                                  }))
                                }
                                placeholder="SMS kodu"
                                className="h-8"
                                inputMode="numeric"
                                maxLength={12}
                              />
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 shrink-0"
                                disabled={
                                  busyId === row.id ||
                                  !(codes[row.id] ?? '').trim()
                                }
                                onClick={() =>
                                  void post(row.id, 'sms-confirm', {
                                    code: codes[row.id]
                                  })
                                }
                              >
                                Onayla
                              </Button>
                            </div>
                          </div>
                        )}

                      {info[row.id] && (
                        <p className="text-[11px] text-emerald-700">
                          {info[row.id]}
                        </p>
                      )}
                      {errors[row.id] && (
                        <p className="text-[11px] text-destructive">
                          {errors[row.id]}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="p-8 text-center text-muted-foreground"
                >
                  Filtreye uyan fatura yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detailId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <button
            type="button"
            className="flex-1 cursor-default"
            aria-label="Kapat"
            onClick={() => setDetailId(null)}
          />
          <aside className="flex h-full w-full max-w-md flex-col border-l bg-background shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="font-semibold">Fatura detayı</h3>
                <p className="text-xs text-muted-foreground">
                  {String(
                    detail.data?.invoiceNumber ??
                      rows.find((r) => r.id === detailId)?.invoiceNumber ??
                      ''
                  )}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setDetailId(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 text-sm">
              {detail.loading && (
                <p className="text-muted-foreground">Yükleniyor…</p>
              )}
              {detail.error && (
                <p className="text-destructive">{detail.error}</p>
              )}
              {detail.data && (
                <DetailBody
                  data={detail.data}
                  onPdf={() => {
                    const row = rows.find((r) => r.id === detailId);
                    if (row) void downloadPdf(row);
                  }}
                />
              )}
              {!detail.loading && !detail.data && !detail.error && (
                <DetailBodyFromRow
                  row={rows.find((r) => r.id === detailId)!}
                  onPdf={() => {
                    const row = rows.find((r) => r.id === detailId);
                    if (row) void downloadPdf(row);
                  }}
                />
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function DetailBody({
  data,
  onPdf
}: {
  data: Record<string, unknown>;
  onPdf: () => void;
}) {
  const lines = Array.isArray(data.lines)
    ? (data.lines as InvoiceGibLine[])
    : [];
  const currency =
    typeof data.currency === 'string' ? data.currency : 'TRY';

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <dt className="text-muted-foreground">Tip</dt>
        <dd>{typeLabel(String(data.type ?? ''))}</dd>
        <dt className="text-muted-foreground">Durum</dt>
        <dd>{String(data.lifecycleLabel ?? data.status ?? '')}</dd>
        <dt className="text-muted-foreground">Alıcı</dt>
        <dd>{String(data.buyerName ?? '')}</dd>
        <dt className="text-muted-foreground">VKN/TCKN</dt>
        <dd className="font-mono">{String(data.buyerTaxNumber ?? '—')}</dd>
        <dt className="text-muted-foreground">Kanal</dt>
        <dd>
          {String(data.channel ?? '—')}
          {data.mock ? ' (mock)' : ''}
        </dd>
        <dt className="text-muted-foreground">UUID/ETTN</dt>
        <dd className="break-all font-mono text-[10px]">
          {String(data.eInvoiceUuid ?? data.ettn ?? '—')}
        </dd>
        {data.envelopeUuid ? (
          <>
            <dt className="text-muted-foreground">Zarf</dt>
            <dd className="break-all font-mono text-[10px]">
              {String(data.envelopeUuid)}
            </dd>
          </>
        ) : null}
        {data.originalInvoiceNumber ? (
          <>
            <dt className="text-muted-foreground">Orijinal</dt>
            <dd>{String(data.originalInvoiceNumber)}</dd>
          </>
        ) : null}
      </dl>

      <div>
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
          Satırlar
        </p>
        <ul className="space-y-2">
          {lines.map((l, i) => (
            <li key={i} className="rounded border p-2 text-xs">
              <p className="font-medium">{l.description}</p>
              <p className="text-muted-foreground">
                {l.quantity} × {money(l.unitPriceNet, currency)} · KDV %
                {l.vatRate} · {money(l.totalGross, currency)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded border bg-muted/30 p-3 text-xs">
        <p>Ara toplam: {money(Number(data.subtotalNet ?? 0), currency)}</p>
        <p>
          KDV (%{Number(data.vatRate ?? 0)}):{' '}
          {money(Number(data.vatAmount ?? 0), currency)}
        </p>
        <p className="font-semibold">
          Toplam: {money(Number(data.totalGross ?? 0), currency)}
        </p>
      </div>

      {data.lastError ? (
        <div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <p className="font-medium">GİB log</p>
          <p className="mt-1 break-words">{String(data.lastError)}</p>
        </div>
      ) : null}

      <Button type="button" size="sm" variant="outline" onClick={onPdf}>
        <FileDown className="mr-1 size-3.5" />
        PDF indir
      </Button>
    </div>
  );
}

function DetailBodyFromRow({
  row,
  onPdf
}: {
  row: InvoiceGibRow;
  onPdf: () => void;
}) {
  return (
    <DetailBody
      data={{
        type: row.type,
        lifecycleLabel: LIFECYCLE_LABELS[row.lifecycle],
        status: row.status,
        buyerName: row.buyerName,
        buyerTaxNumber: row.buyerTaxNumber,
        channel: row.channelId,
        mock: row.mock,
        eInvoiceUuid: row.eInvoiceUuid,
        ettn: row.ettn,
        envelopeUuid: row.envelopeUuid,
        originalInvoiceNumber: row.originalInvoiceNumber,
        lines: row.lines,
        subtotalNet: row.subtotalNet,
        vatRate: row.vatRate,
        vatAmount: row.vatAmount,
        totalGross: row.totalGross,
        currency: row.currency,
        lastError: row.lastError
      }}
      onPdf={onPdf}
    />
  );
}
