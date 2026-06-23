'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Search, UserPlus } from 'lucide-react';
import { EventJoyHeader } from '@/components/eventjoy/mobile-shell';
import { mockContacts } from '@/lib/data/mock-eventjoy';
import { cn } from '@/lib/utils';

export function AddGuestsClient({ eventId }: { eventId: string }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (!query) return mockContacts;
    const q = query.toLowerCase();
    return mockContacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof mockContacts>();
    filtered.forEach((c) => {
      const letter = c.name.charAt(0).toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(c);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'tr'));
  }, [filtered]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col bg-white">
      <EventJoyHeader
        title="Misafir Ekle"
        backHref={`/eventjoy/misafirler/${eventId}`}
        rightAction={
          <Link href={`/eventjoy/misafirler/${eventId}/yeni-kisi`}>
            <UserPlus className="size-5" />
          </Link>
        }
      />

      <div className="h-1 bg-emerald-500" />

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

      <div className="flex-1 overflow-y-auto pb-24">
        {grouped.map(([letter, contacts]) => (
          <div key={letter}>
            <p className="bg-muted/40 px-4 py-1 text-sm font-bold">{letter}</p>
            {contacts.map((contact) => {
              const isSelected = selected.includes(contact.id);
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => toggle(contact.id)}
                  className="flex w-full items-center gap-3 border-b px-4 py-3 text-left"
                >
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      contact.color
                    )}
                  >
                    {contact.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full border-2',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {isSelected && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 p-4">
        <button
          type="button"
          disabled={selected.length === 0}
          className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold uppercase text-primary-foreground disabled:opacity-50"
        >
          Davetiye Gönder
        </button>
      </div>
    </div>
  );
}
