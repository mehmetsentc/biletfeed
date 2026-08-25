'use client';

import { useState } from 'react';
import { Loader2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type CategoryOption = { id: string; name: string; price: number };

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
    percent: number | null;
    ticketTypeIds: string[];
    active: boolean;
    endsAt: string | null;
  };
  /** Organizer: `/api/organizer/events/${id}/sale-discount` · Admin: `/api/admin/events/sale-discount` */
  apiPath: string;
}) {
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
      percent: Number.isFinite(pct) ? pct : null,
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
      setMsg('İndirim kaydedildi — onaya gerek yok, satışta hemen görünür.');
    } catch {
      setMsg('Bağlantı hatası');
    } finally {
      setSaving(false);
    }
  }

  if (isFree) {
    return (
      <p className="text-sm text-muted-foreground">
        Ücretsiz etkinlikte yüzde indirim uygulanmaz.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Percent className="size-4 text-primary" />
          <Label htmlFor="sale-active">İndirim aktif</Label>
        </div>
        <Switch id="sale-active" checked={active} onCheckedChange={setActive} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
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
          />
          Tüm kategoriler
        </label>
        {!allCategories && (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setSelected((prev) =>
                      on ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                    )
                  }
                  className={
                    on
                      ? 'rounded-lg border border-primary bg-primary/10 px-2.5 py-1 text-xs font-medium'
                      : 'rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground'
                  }
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}

      <Button type="button" onClick={() => void save()} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        İndirimi kaydet
      </Button>
    </div>
  );
}
