'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

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
  { slug: 'diger', label: '📌 Diğer' },
];

export function EventFilters({ cities }: { cities: string[] }) {
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

  return (
    <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/30 p-4">
      {/* Kategori */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Kategori</label>
        <select
          value={cat}
          onChange={(e) => update('kategori', e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm min-w-[140px]"
        >
          <option value="">Tümü</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Şehir */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Şehir</label>
        <select
          value={city}
          onChange={(e) => update('sehir', e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm min-w-[130px]"
        >
          <option value="">Tüm şehirler</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tarih */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Tarihten itibaren</label>
        <input
          type="date"
          value={date}
          onChange={(e) => update('tarih', e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </div>

      {/* Temizle */}
      {(cat || city || date) && (
        <div className="flex flex-col justify-end">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('kategori');
              params.delete('sehir');
              params.delete('tarih');
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            ✕ Temizle
          </button>
        </div>
      )}
    </div>
  );
}
