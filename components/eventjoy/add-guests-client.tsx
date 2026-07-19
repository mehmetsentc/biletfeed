'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Search, UserPlus } from 'lucide-react';
import { EventJoyHeader } from '@/components/eventjoy/mobile-shell';
import { useEventJoy } from '@/components/providers/eventjoy-provider';
import { cn } from '@/lib/utils';

export function AddGuestsClient({ eventId }: { eventId: string }) {
  const { contacts, addContact, addGuestsToEvent } = useEventJoy();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const filtered = useMemo(() => {
    if (!query) return contacts;
    const q = query.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [contacts, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof contacts>();
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

  function handleInvite() {
    if (selected.length > 0) {
      addGuestsToEvent(eventId, selected);
      window.location.href = `/eventjoy/misafirler/${eventId}`;
    }
  }

  function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addContact(name, phone);
    setName('');
    setPhone('');
    setShowAdd(false);
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col">
      <EventJoyHeader
        title="Misafir Ekle"
        backHref={`/eventjoy/misafirler/${eventId}`}
        rightAction={
          <button type="button" onClick={() => setShowAdd(true)} aria-label="Kişi ekle">
            <UserPlus className="size-5" />
          </button>
        }
      />

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kişi ara"
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none"
          />
        </div>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddContact}
          className="mx-4 mb-3 space-y-2 rounded-xl border border-border bg-card p-4"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ad Soyad"
            className="w-full rounded-lg border border-input px-3 py-2 text-sm"
            required
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefon"
            className="w-full rounded-lg border border-input px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="flex-1 rounded-lg border py-2 text-sm"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
            >
              Kaydet
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto pb-24">
        {contacts.length === 0 && !showAdd && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Henüz kişi yok. Sağ üstten yeni kişi ekleyin.
          </p>
        )}
        {grouped.map(([letter, list]) => (
          <div key={letter}>
            <p className="bg-muted/40 px-4 py-1 text-sm font-bold">{letter}</p>
            {list.map((contact) => {
              const isSelected = selected.includes(contact.id);
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => toggle(contact.id)}
                  className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left"
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
                    <p className="font-medium text-foreground">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                  {isSelected && <Check className="size-5 text-[var(--bf-accent-ink)]" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4 lg:static lg:mt-4 lg:border-0 lg:p-0">
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={handleInvite}
          className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold uppercase text-primary-foreground disabled:opacity-50"
        >
          Davetiye Gönder ({selected.length})
        </button>
      </div>
    </div>
  );
}
