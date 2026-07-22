'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileDown, RefreshCw, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type InvoiceGibRow = {
  id: string;
  invoiceNumber: string;
  issuedAtLabel: string;
  buyerName: string;
  eventTitle: string;
  amountLabel: string;
  type: string;
  status: string;
  gibStatus: string;
  needsSmsSign: boolean;
  eInvoiceUuid: string | null;
  lastError: string | null;
  phoneMasked: string | null;
};

export function InvoiceGibTable({ rows }: { rows: InvoiceGibRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [info, setInfo] = useState<Record<string, string>>({});

  async function post(
    invoiceId: string,
    path: string,
    body?: Record<string, unknown>
  ) {
    setBusyId(invoiceId);
    setErrors((p) => ({ ...p, [invoiceId]: '' }));
    try {
      const res = await fetch(
        `/api/admin/accounting/invoices/${invoiceId}/${path}`,
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined
        }
      );
      const data = (await res.json()) as {
        error?: string;
        phoneMasked?: string;
        oid?: string;
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
      router.refresh();
    } finally {
      setBusyId(null);
    }
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
      <table className="w-full min-w-[1100px] text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th className="p-3 font-medium">No</th>
            <th className="p-3 font-medium">Tarih</th>
            <th className="p-3 font-medium">Alıcı</th>
            <th className="p-3 font-medium">Etkinlik</th>
            <th className="p-3 font-medium">Tutar</th>
            <th className="p-3 font-medium">Tip</th>
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

            return (
              <tr key={row.id} className="border-b last:border-0 align-top">
                <td className="p-3 font-medium">{row.invoiceNumber}</td>
                <td className="p-3">{row.issuedAtLabel}</td>
                <td className="p-3">{row.buyerName}</td>
                <td className="p-3">{row.eventTitle}</td>
                <td className="p-3 whitespace-nowrap">{row.amountLabel}</td>
                <td className="p-3">{row.type}</td>
                <td className="p-3">
                  <Badge variant={gibBadge}>{gibLabel}</Badge>
                  {row.eInvoiceUuid && (
                    <p className="mt-1 max-w-[140px] truncate font-mono text-[10px] text-muted-foreground">
                      {row.eInvoiceUuid}
                    </p>
                  )}
                  {row.lastError && (
                    <p className="mt-1 max-w-[180px] text-[11px] text-destructive">
                      {row.lastError}
                    </p>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex min-w-[220px] flex-col gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 px-2"
                        disabled={busyId === row.id}
                        onClick={() =>
                          void post(row.id, 'submit-einvoice', { force: true })
                        }
                      >
                        <RefreshCw className="size-3.5" />
                        GİB gönder
                      </Button>
                      {(row.needsSmsSign ||
                        row.gibStatus === 'submitted' ||
                        row.gibStatus === 'accepted') &&
                        row.eInvoiceUuid && (
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

                    {(row.needsSmsSign || row.gibStatus === 'submitted') && (
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
