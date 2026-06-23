'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Search, UserPlus } from 'lucide-react';
import { EventJoyHeader, GuestStatusLabel } from '@/components/eventjoy/mobile-shell';
import { getGuestCounts } from '@/lib/eventjoy/utils';
import type { EventJoyEvent } from '@/lib/eventjoy/types';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'yes' | 'no' | 'pending';

const tabs: { id: Tab; label: (c: ReturnType<typeof getGuestCounts>) => string }[] = [
  { id: 'all', label: (c) => `Tümü(${c.all})` },
  { id: 'yes', label: (c) => `Evet(${c.yes})` },
  { id: 'no', label: (c) => `Hayır(${c.no})` },
  { id: 'pending', label: (c) => `Yanıt Bekleniyor(${c.pending})` }
];

export function GuestListClient({ event }: { event: EventJoyEvent }) {
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const counts = getGuestCounts(event);

  const filtered = useMemo(() => {
    return event.guests.filter((g) => {
      if (tab === 'yes' && g.status !== 'confirmed') return false;
      if (tab === 'no' && g.status !== 'declined') return false;
      if (tab === 'pending' && g.status !== 'pending') return false;
      if (query) {
        const q = query.toLowerCase();
        return g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [event.guests, tab, query]);

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <EventJoyHeader
        title="Misafir Listesi"
        backHref={`/eventjoy/etkinlik/${event.id}`}
        rightAction={
          <Link href={`/eventjoy/misafirler/${event.id}/ekle`}>
            <UserPlus className="size-5 text-foreground" />
          </Link>
        }
      />

      <div className="flex border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 border-b-2 px-1 py-3 text-[11px] font-medium transition-colors sm:text-xs',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            )}
          >
            {t.label(counts)}
          </button>
        ))}
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kişi ara"
            className="w-full rounded-lg bg-muted/60 py-2.5 pl-10 pr-4 text-sm outline-none"
          />
        </div>
      </div>

      <ul className="divide-y divide-border">
        {filtered.length === 0 ? (
          <li className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {event.guests.length === 0
                ? 'Henüz misafir eklenmedi.'
                : 'Arama kriterine uygun misafir bulunamadı.'}
            </p>
            {event.guests.length === 0 && (
              <Link
                href={`/eventjoy/misafirler/${event.id}/ekle`}
                className="mt-3 inline-block text-sm font-semibold text-primary"
              >
                Misafir ekle
              </Link>
            )}
          </li>
        ) : (
          filtered.map((guest) => (
          <li key={guest.id} className="flex items-center justify-between px-4 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{guest.name}</p>
              <p className="truncate text-sm text-muted-foreground">{guest.email}</p>
              {guest.plusOne && guest.status === 'confirmed' && (
                <p className="mt-0.5 text-sm font-medium text-emerald-600">
                  {guest.plusOne} Yetişkin
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <GuestStatusLabel status={guest.status} />
              <button type="button" className="text-muted-foreground">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </li>
        ))
        )}
      </ul>
    </div>
  );
}
