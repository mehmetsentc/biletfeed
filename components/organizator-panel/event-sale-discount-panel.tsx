'use client';

import { useState } from 'react';
import { Gift, Loader2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type CategoryOption = { id: string; name: string; price: number };
type CampaignType = 'percent' | 'bogo';

export function EventSaleDiscountPanel({
  eventId,
  isFree,
  categories,
  initial,
  apiPath
}: {
  eventId: string;
  isFree: boolean;
  categories: CategoryOption[];
  initial: {
    campaignType?: CampaignType | null;
    percent: number | null;
    ticketTypeIds: string[];
    active: boolean;
    endsAt: string | null;
  };
  /** Organizer: `/api/organizer/events/${id}/sale-discount` · Admin: `/api/admin/events/sale-discount` */
  apiPath: string;
}) {
  const [campaignType, setCampaignType] = useState<CampaignType>(
    initial.campaignType === 'bogo' ? 'bogo' : 'percent'
  );
  const [percent, setPercent] = useState(String(initial.percent ?? 10));
  const [active, setActive] = useState(initial.active);
  const [allCategories, setAllCategories] = useState(
    initial.ticketTypeIds.length === 0
  );
  const [selected, setSelected] = useState<string[]>(initial.ticketTypeIds);
  const [endsAt, setEndsAt] = useState(
    initial.endsAt ? initial.endsAt.slice(0, 16) : ''
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const pct = Number(percent);
    const body: Record<string, unknown> = {
      campaignType,
      percent:
        campaignType === 'bogo'
          ? null
          : Number.isFinite(pct)
            ? pct
            : null,
      active,
      ticketTypeIds: allCategories ? [] : selected,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null
    };
    if (apiPath.includes('/admin/')) {
      body.eventId = eventId;
    }
    try {
      const res = await fetch(apiPath, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? 'Kayıt başarısız');
        return;
      }
      setMsg(
        campaignType === 'bogo'
          ? '1 alana 1 bedava kaydedildi — satışta hemen görünür.'
          : 'İndirim kaydedildi — onaya gerek yok, satışta hemen görünür.'
      );
    } catch {
      setMsg('Bağlantı hatası');
    } finally {
      setSaving(false);
    }
  }

  if (isFree) {
    return (
      <p className="text-sm text-muted-foreground">
        Ücretsiz etkinlikte kampanya uygulanmaz.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {campaignType === 'bogo' ? (
            <Gift className="size-4 text-primary" />
          ) : (
            <Percent className="size-4 text-primary" />
          )}
          <Label htmlFor="sale-active">Kampanya aktif</Label>
        </div>
        <Switch id="sale-active" checked={active} onCheckedChange={setActive} />
      </div>

      <div className="space-y-1.5">
        <Label>Kampanya tipi</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setCampaignType('percent')}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              campaignType === 'percent'
                ? 'border-primary bg-primary/10 font-semibold'
                : 'border-border hover:bg-muted/50'
            }`}
          >
            Yüzde indirim
          </button>
          <button
            type="button"
            onClick={() => setCampaignType('bogo')}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              campaignType === 'bogo'
                ? 'border-primary bg-primary/10 font-semibold'
                : 'border-border hover:bg-muted/50'
            }`}
          >
            1 alana 1 bedava
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {campaignType === 'percent' ? (
          <div className="space-y-1.5">
            <Label htmlFor="sale-pct">İndirim %</Label>
            <Input
              id="sale-pct"
              type="number"
              min={1}
              max={100}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="h-10"
            />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground sm:col-span-1">
            Aynı kategoriden 2 bilet → 1 ücret. Stokta 2 QR üretilir.
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="sale-ends">Bitiş (opsiyonel)</Label>
          <Input
            id="sale-ends"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allCategories}
            onChange={(e) => setAllCategories(e.target.checked)}
            className="size-4 rounded border-border"
          />
          Tüm kategoriler
        </label>
        {!allCategories && (
          <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
            {categories.map((c) => {
              const on = selected.includes(c.id);
              return (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      setSelected((prev) =>
                        on ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                      )
                    }
                    className="size-4 rounded border-border"
                  />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-muted-foreground">
                    {c.price.toLocaleString('tr-TR')} ₺
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <Button
        type="button"
        onClick={() => void save()}
        disabled={saving || (active && campaignType === 'percent' && !Number(percent))}
        className="w-full"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Kaydet
      </Button>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
