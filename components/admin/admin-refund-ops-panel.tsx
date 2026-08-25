'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type BankRow = {
  id: string;
  amount: number;
  iban: string;
  accountHolder: string;
  status: string;
  reason: string | null;
  createdAt: string;
  order: {
    id: string;
    total: number;
    user: { displayName: string | null; email: string | null } | null;
    event: { title: string } | null;
  };
};

type OrgReq = {
  id: string;
  reason: string | null;
  status: string;
  createdAt: string;
  organizer: { name: string };
  order: {
    id: string;
    total: number;
    user: { displayName: string | null; email: string | null } | null;
    event: { title: string } | null;
  };
};

export function AdminRefundOpsPanel() {
  const [bank, setBank] = useState<BankRow[]>([]);
  const [orgReqs, setOrgReqs] = useState<OrgReq[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [b, o] = await Promise.all([
      fetch('/api/admin/bank-refunds', { credentials: 'same-origin' }),
      fetch('/api/admin/refund-requests?status=pending', {
        credentials: 'same-origin'
      })
    ]);
    if (b.ok) {
      const data = (await b.json()) as { requests: BankRow[] };
      setBank(data.requests ?? []);
    }
    if (o.ok) {
      const data = (await o.json()) as { requests: OrgReq[] };
      setOrgReqs(data.requests ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchBank(id: string, status: string) {
    const paymentRef =
      status === 'completed'
        ? window.prompt('EFT referans no (opsiyonel)') ?? undefined
        : undefined;
    const res = await fetch('/api/admin/bank-refunds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id, status, paymentRef })
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setMsg(data.error ?? 'Güncelleme başarısız');
      return;
    }
    setMsg('Banka talebi güncellendi');
    await load();
  }

  async function reviewOrg(id: string, approve: boolean) {
    let bankDetails: { accountHolder: string; iban: string } | undefined;
    if (approve) {
      const needBank = window.confirm(
        'Kart iadesi başarısız olursa banka IBAN kullanılacak. IBAN girmek ister misiniz?'
      );
      if (needBank) {
        const accountHolder = window.prompt('Hesap sahibi');
        const iban = window.prompt('IBAN');
        if (accountHolder && iban) {
          bankDetails = { accountHolder, iban };
        }
      }
    }
    const res = await fetch('/api/admin/refund-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        id,
        approve,
        reviewNote: approve ? 'Onaylandı' : 'Reddedildi',
        bankDetails
      })
    });
    const data = (await res.json()) as { error?: string; message?: string };
    if (!res.ok) {
      setMsg(data.error ?? 'İşlem başarısız');
      return;
    }
    setMsg(data.message ?? 'Tamam');
    await load();
  }

  return (
    <div className="space-y-6">
      {msg ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          {msg}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Organizatör iade talepleri</h2>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3">Tarih</th>
                <th className="p-3">Organizatör</th>
                <th className="p-3">Etkinlik</th>
                <th className="p-3">Müşteri</th>
                <th className="p-3">Tutar</th>
                <th className="p-3">Neden</th>
                <th className="p-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {orgReqs.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="p-3">{r.organizer.name}</td>
                  <td className="p-3 max-w-[160px] truncate">
                    {r.order.event?.title ?? '—'}
                  </td>
                  <td className="p-3">
                    {r.order.user?.displayName ?? r.order.user?.email ?? '—'}
                  </td>
                  <td className="p-3 font-medium">
                    ₺{r.order.total.toLocaleString('tr-TR')}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {r.reason ?? '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => void reviewOrg(r.id, true)}
                      >
                        Onayla
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => void reviewOrg(r.id, false)}
                      >
                        Reddet
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {orgReqs.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-muted-foreground"
                  >
                    Bekleyen organizatör talebi yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Banka iade talepleri</h2>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3">Tarih</th>
                <th className="p-3">Etkinlik</th>
                <th className="p-3">Alıcı</th>
                <th className="p-3">IBAN</th>
                <th className="p-3">Tutar</th>
                <th className="p-3">Durum</th>
                <th className="p-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {bank.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="p-3 max-w-[160px] truncate">
                    {r.order.event?.title ?? '—'}
                  </td>
                  <td className="p-3">{r.accountHolder}</td>
                  <td className="p-3 font-mono text-xs">{r.iban}</td>
                  <td className="p-3 font-medium">
                    ₺{r.amount.toLocaleString('tr-TR')}
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">{r.status}</Badge>
                  </td>
                  <td className="p-3">
                    {r.status === 'pending' || r.status === 'sent' ? (
                      <div className="flex gap-1">
                        {r.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => void patchBank(r.id, 'sent')}
                          >
                            Gönderildi
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => void patchBank(r.id, 'completed')}
                        >
                          Tamamla
                        </Button>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {bank.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-6 text-center text-muted-foreground"
                  >
                    Banka iade talebi yok
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
