'use client';

import Link from 'next/link';
import { use } from 'react';
import { ChevronRight, ListTodo, Mail, Users, Wallet } from 'lucide-react';
import { EventJoyHeader } from '@/components/eventjoy/mobile-shell';
import { useEventJoy } from '@/components/providers/eventjoy-provider';
import { getGuestCounts } from '@/lib/eventjoy/utils';
import { cn } from '@/lib/utils';

export function EventJoyDetail({ id }: { id: string }) {
  const { ready, getEvent } = useEventJoy();
  const event = getEvent(id);

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (!event) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="font-semibold text-foreground">Etkinlik bulunamadı</p>
        <Link href="/eventjoy/etkinlikler" className="mt-4 text-sm text-primary hover:underline">
          Etkinliklere dön
        </Link>
      </div>
    );
  }

  const counts = getGuestCounts(event);
  const budgetPercent =
    event.budget > 0 ? Math.round((event.spent / event.budget) * 100) : 0;

  const links = [
    {
      href: `/eventjoy/misafirler/${id}`,
      icon: Users,
      label: 'Misafir Listesi',
      sub: `${counts.yes} onaylı`
    },
    {
      href: `/eventjoy/etkinlik/${id}/gorevler`,
      icon: ListTodo,
      label: 'Görev Listesi',
      sub: `${event.tasks.length} görev`
    },
    {
      href: `/eventjoy/etkinlik/${id}/butce`,
      icon: Wallet,
      label: 'Bütçe',
      sub: event.budget > 0 ? `%${budgetPercent} kullanıldı` : 'Henüz eklenmedi'
    },
    {
      href: `/eventjoy/davetiye/${id}`,
      icon: Mail,
      label: 'Davetiye',
      sub: 'Paylaş & Gönder'
    }
  ];

  return (
    <div className="px-4 py-4 lg:px-0 lg:py-0">
      <EventJoyHeader title="Etkinlik Yönetimi" backHref="/eventjoy/etkinlikler" />

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:mt-6">
        <div
          className={cn(
            'relative overflow-hidden bg-gradient-to-br p-6 text-white',
            event.coverColor
          )}
        >
          {event.coverImage && (
            <img
              src={event.coverImage}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-60"
            />
          )}
          <div className="relative">
            <p className="text-xs opacity-90">{event.type}</p>
            <h2 className="text-xl font-bold">{event.title}</h2>
            <p className="mt-2 text-sm opacity-90">
              {new Date(event.date).toLocaleDateString('tr-TR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}{' '}
              · {event.time}
            </p>
            {event.location && (
              <p className="mt-1 text-sm opacity-80">{event.location}</p>
            )}
          </div>
        </div>

        {event.guests.length > 0 ? (
          <div className="flex justify-center gap-1 border-b border-border py-4">
            {event.guests.slice(0, 5).map((g) => (
              <span
                key={g.id}
                className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground"
              >
                {g.name.charAt(0)}
              </span>
            ))}
            {event.guests.length > 5 && (
              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                +{event.guests.length - 5}
              </span>
            )}
          </div>
        ) : (
          <p className="border-b border-border px-5 py-4 text-center text-sm text-muted-foreground">
            Henüz misafir eklenmedi.
          </p>
        )}

        <ul className="divide-y divide-border">
          {links.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-muted/50"
              >
                <item.icon className="size-5 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.sub}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function EventJoyDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <EventJoyDetail id={id} />;
}
