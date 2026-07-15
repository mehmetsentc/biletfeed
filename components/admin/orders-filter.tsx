'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface Event {
  id: string;
  title: string;
}

interface OrdersFilterProps {
  events: Event[];
  currentEventId: string;
  currentKategori: string;
  stats: {
    toplam: number;
    ucretli: number;
    ucretsiz: number;
    davetiye: number;
  };
}

const KATEGORI_OPTIONS = [
  { value: '', label: 'Tümü' },
  { value: 'ucretli', label: '💳 Ücretli' },
  { value: 'ucretsiz', label: '🎟 Ücretsiz' },
  { value: 'davetiye', label: '✉️ Davetiye' }
];

export function OrdersFilter({ events, currentEventId, currentKategori, stats }: OrdersFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      {/* Özet kartlar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Toplam Sipariş" value={stats.toplam} color="default" />
        <StatCard label="💳 Ücretli" value={stats.ucretli} color="green" />
        <StatCard label="🎟 Ücretsiz" value={stats.ucretsiz} color="blue" />
        <StatCard label="✉️ Davetiye" value={stats.davetiye} color="purple" />
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Etkinlik seçici */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Etkinlik:</label>
          <select
            value={currentEventId}
            onChange={(e) => update('eventId', e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Tüm etkinlikler</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        {/* Kategori butonları */}
        <div className="flex items-center gap-1">
          {KATEGORI_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update('kategori', opt.value)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                currentKategori === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Temizle */}
        {(currentEventId || currentKategori) && (
          <button
            onClick={() => router.push('?')}
            className="ml-auto text-xs text-muted-foreground underline hover:text-foreground"
          >
            Filtreleri temizle
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: 'default' | 'green' | 'blue' | 'purple';
}) {
  const colorMap = {
    default: 'bg-muted/50',
    green: 'bg-green-500/10',
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10'
  };
  return (
    <div className={`rounded-lg border p-3 ${colorMap[color]}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
