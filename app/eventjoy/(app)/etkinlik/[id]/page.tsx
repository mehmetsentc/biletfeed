import Link from 'next/link';
import { ChevronRight, Users, ListTodo, Wallet, Mail } from 'lucide-react';
import { notFound } from 'next/navigation';
import { EventJoyHeader } from '@/components/eventjoy/mobile-shell';
import { getEventJoyEvent, getGuestCounts } from '@/lib/data/mock-eventjoy';
import { cn } from '@/lib/utils';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventJoyDetailPage({ params }: Props) {
  const { id } = await params;
  const event = getEventJoyEvent(id);
  if (!event) notFound();

  const counts = getGuestCounts(event);
  const budgetPercent = event.budget > 0 ? Math.round((event.spent / event.budget) * 100) : 0;

  const links = [
    { href: `/eventjoy/misafirler/${id}`, icon: Users, label: 'Misafir Listesi', sub: `${counts.yes} onaylı` },
    { href: `/eventjoy/etkinlik/${id}/gorevler`, icon: ListTodo, label: 'Görev Listesi', sub: `${event.tasks.length} görev` },
    { href: `/eventjoy/etkinlik/${id}/butce`, icon: Wallet, label: 'Bütçe', sub: `%${budgetPercent} kullanıldı` },
    { href: `/eventjoy/davetiye/${id}`, icon: Mail, label: 'Davetiye', sub: 'Düzenle' }
  ];

  return (
    <div className="bg-white">
      <EventJoyHeader title="Etkinlik Yönetimi" backHref="/eventjoy/etkinlikler" />

      <div className={cn('relative mx-4 mt-4 overflow-hidden rounded-xl bg-gradient-to-br p-5 text-white', event.coverColor)}>
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
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-1 px-4">
        {event.guests.slice(0, 5).map((g) => (
          <span
            key={g.id}
            className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-bold"
          >
            {g.name.charAt(0)}
          </span>
        ))}
        {event.guests.length > 5 && (
          <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs">
            +{event.guests.length - 5}
          </span>
        )}
      </div>

      <ul className="mt-6 divide-y">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-4 px-4 py-4"
            >
              <item.icon className="size-5 text-[#E53935]" />
              <div className="flex-1">
                <p className="font-semibold">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.sub}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
