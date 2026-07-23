'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileDown, RefreshCw, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GibErrorCategory } from '@/lib/accounting/einvoice/gib-errors';

export type InvoiceDocumentTypeChoice = 'e_arsiv' | 'e_fatura';

export type InvoiceGibRow = {
  id: string;
  invoiceNumber: string;
  issuedAtLabel: string;
  /** date input için YYYY-MM-DD */
  issuedAtDate: string;
  buyerName: string;
  eventTitle: string;
  amountLabel: string;
  type: string;
  suggestedType: InvoiceDocumentTypeChoice;
  status: string;
  gibStatus: string;
  needsSmsSign: boolean;
  eInvoiceUuid: string | null;
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
};

function typeLabel(t: string): string {
  if (t === 'e_fatura') return 'e-Fatura';
  if (t === 'e_arsiv') return 'e-Arşiv';
  if (t === 'credit_note') return 'İade';
  return t;
}

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

  const typeById = useMemo(() => {
    const map: Record<string, InvoiceDocumentTypeChoice> = {};
    for (const row of rows) {
      if (row.type === 'e_fatura' || row.type === 'e_arsiv') {
        map[row.id] = row.type;
      }
    }
    return map;
  }, [rows]);

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
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  function saveType(row: InvoiceGibRow, next: InvoiceDocumentTypeChoice) {
    const suggested = row.suggestedType;
    let overrideConfirmed = true;
    if (next !== suggested) {
      const ok = window.confirm(
        `Önerilen tip: ${typeLabel(suggested)} (VKN/TCKN’ye göre).\n` +
          `Seçiminiz: ${typeLabel(next)}.\n\n` +
          `Farklı belge tipi ile devam etmek istediğinize emin misiniz?`
      );
      if (!ok) {
        setTypes((p) => ({ ...p, [row.id]: (row.type as InvoiceDocumentTypeChoice) }));
        return;
      }
      overrideConfirmed = true;
    }
    setTypes((p) => ({ ...p, [row.id]: next }));
    void post(row.id, 'document-type', { type: next, overrideConfirmed }, 'PATCH');
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Henüz fatura yok.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[1200px] text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="p-3 font-medium">No</th>
            <th className="p-3 font-medium">Tarih</th>
            <th className="p-3 font-medium">Alıcı</th>
            <th className="p-3 font-medium">Etkinlik</th>
            <th className="p-3 font-medium">Tutar</th>
            <th className="p-3 font-medium">Belge tipi / kanal</th>
            <th className="p-3 font-medium">GİB</th>
            <th className="p-3 font-medium">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const gibBadge: 'success' | 'destructive' | 'secondary' =
              row.gibStatus === 'accepted'
                ? 'success'
                : row.gibStatus === 'failed' || row.gibStatus === 'rejected'
                  ? 'destructive'
                  : 'secondary';
            const gibLabel =
              row.gibStatus === 'accepted'
                ? 'Onaylı'
                : row.needsSmsSign
                  ? 'SMS bekliyor'
                  : row.gibStatus === 'submitted'
                    ? 'Taslak'
                    : row.gibStatus === 'skipped'
                      ? 'Atlandı'
                      : row.gibStatus === 'failed' || row.gibStatus === 'rejected'
                        ? 'Hata'
                        : row.gibStatus || '—';

            const dateValue = dates[row.id] ?? row.issuedAtDate;
            const sendLabel = row.isRetry ? 'Tekrar dene' : 'GİB gönder';
            const docType = currentType(row);
            const isEfatura = docType === 'e_fatura';
            const channelHint = isEfatura
              ? row.efaturaChannelReady
                ? 'Kanal: BiletFeed e-Fatura'
                : 'Kanal yapılandırılmadı'
              : 'Kanal: GİB e-Arşiv portal';
            const sendBlocked =
              row.sendDisabled || (isEfatura && !row.efaturaChannelReady);

            return (
              <tr key={row.id} className="border-b last:border-0 align-top">
                <td className="p-3 font-medium">{row.invoiceNumber}</td>
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
                <td className="p-3">{row.buyerName}</td>
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
                          const next = e.target.value as InvoiceDocumentTypeChoice;
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
                    <p className="text-[10px] text-muted-foreground">
                      Öneri: {typeLabel(row.suggestedType)}
                    </p>
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
                      </p>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant={gibBadge}>{gibLabel}</Badge>
                  {row.eInvoiceUuid && (
                    <p className="mt-1 max-w-[140px] truncate font-mono text-[10px] text-muted-foreground">
                      {row.eInvoiceUuid}
                    </p>
                  )}
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
                      {row.lastError && (
                        <p
                          className="truncate text-[10px] text-zinc-400"
                          title={row.lastError}
                        >
                          {row.lastError.length > 90
                            ? `${row.lastError.slice(0, 89)}…`
                            : row.lastError}
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
                  <div className="flex min-w-[220px] flex-col gap-2">
                    <p className="text-[10px] text-muted-foreground">
                      Gönderim: {typeLabel(docType)} →{' '}
                      {isEfatura
                        ? 'BiletFeed e-Fatura kanalı'
                        : 'GİB e-Arşiv portal'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
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
                                ? 'e-Fatura gönderimi için entegratör/kanal yapılandırılmadı'
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
                      {(row.needsSmsSign ||
                        row.gibStatus === 'submitted' ||
                        row.gibStatus === 'accepted') &&
                        row.eInvoiceUuid &&
                        !isEfatura && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 px-2"
                            asChild
                          >
                            <a
                              href={`https://earsivportal.efatura.gov.tr/`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FileDown className="size-3.5" />
                              Portal
                            </a>
                          </Button>
                        )}
                    </div>

                    {sendBlocked && (
                      <p className="text-[11px] leading-snug text-amber-800">
                        {row.sendDisabledReason ??
                          (isEfatura && !row.efaturaChannelReady
                            ? 'e-Fatura gönderimi için entegratör/kanal yapılandırılmadı'
                            : null)}
                      </p>
                    )}

                    {(row.needsSmsSign || row.gibStatus === 'submitted') &&
                      !isEfatura && (
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
                      <p className="text-[11px] text-emerald-700">{info[row.id]}</p>
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
        </tbody>
      </table>
    </div>
  );
}
