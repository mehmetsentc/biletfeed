'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Search } from 'lucide-react';

const CATEGORIES = [
  { slug: 'muzik', label: '🎵 Konser' },
  { slug: 'tiyatro', label: '🎭 Tiyatro' },
  { slug: 'festival', label: '🎪 Festival' },
  { slug: 'spor', label: '⚽ Spor' },
  { slug: 'sanat', label: '🎨 Sanat' },
  { slug: 'komedi', label: '😄 Komedi' },
  { slug: 'cocuk', label: '🧒 Çocuk' },
  { slug: 'teknoloji', label: '💻 Workshop' },
  { slug: 'online', label: '🌐 Online' },
  { slug: 'party', label: '🎉 Party' },
  { slug: 'diger', label: '📌 Diğer' }
];

export function EventFilters({
  cities
}: {
  cities: Array<{ slug: string; name: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const cat = searchParams.get('kategori') || '';
  const city = searchParams.get('sehir') || '';
  const date = searchParams.get('tarih') || '';
  const qParam = searchParams.get('q') || '';
  const [qDraft, setQDraft] = useState(qParam);

  const hasFilter = Boolean(cat || city || date || qParam);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    update('q', qDraft.trim());
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <form onSubmit={submitSearch} className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
          placeholder="Etkinlik, organizatör ara… (geçmiş dahil)"
          className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </form>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Kategori</label>
          <select
            value={cat}
            onChange={(e) => update('kategori', e.target.value)}
            className="min-w-[140px] rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Tümü</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Şehir</label>
          <select
            value={city}
            onChange={(e) => update('sehir', e.target.value)}
            className="min-w-[130px] rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Tüm şehirler</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Tarihten itibaren</label>
          <input
            type="date"
            value={date}
            onChange={(e) => update('tarih', e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>

        {hasFilter && (
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={() => {
                setQDraft('');
                router.push(pathname);
              }}
              className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              ✕ Temizle
            </button>
          </div>
        )}
      </div>

      {hasFilter && (
        <p className="text-xs text-muted-foreground">
          Filtre aktif — geçmiş tarihli onaylı etkinlikler de listelenir.
        </p>
      )}
    </div>
  );
}
