import Link from 'next/link';
import { CalendarPlus, Users, MessageCircle } from 'lucide-react';
import { mockEventJoyEvents } from '@/lib/data/mock-eventjoy';

export default function EventJoyHomePage() {
  const nextEvent = mockEventJoyEvents[0];
  const totalGuests = mockEventJoyEvents.reduce((a, e) => a + e.confirmedCount, 0);

  return (
    <div className="bg-white px-4 py-6">
      <p className="text-sm text-muted-foreground">Merhaba 👋</p>
      <h1 className="text-2xl font-bold">Dylan Thomas</h1>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#E53935]/10 p-4">
          <p className="text-2xl font-bold text-[#E53935]">{mockEventJoyEvents.length}</p>
          <p className="text-xs text-muted-foreground">Etkinlik</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-2xl font-bold text-emerald-600">{totalGuests}</p>
          <p className="text-xs text-muted-foreground">Onaylı Misafir</p>
        </div>
      </div>

      {nextEvent && (
        <div className="mt-8">
          <p className="text-sm font-semibold text-muted-foreground">Yaklaşan Etkinlik</p>
          <Link
            href={`/eventjoy/etkinlik/${nextEvent.id}`}
            className="mt-2 block overflow-hidden rounded-xl border"
          >
            <img
              src={nextEvent.coverImage}
              alt={nextEvent.title}
              className="aspect-[2/1] w-full object-cover"
            />
            <div className="p-4">
              <p className="font-bold">{nextEvent.title}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(nextEvent.date).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
          </Link>
        </div>
      )}

      <div className="mt-8 grid grid-cols-3 gap-2">
        {[
          { href: '/eventjoy/yeni', icon: CalendarPlus, label: 'Oluştur' },
          { href: `/eventjoy/misafirler/${nextEvent?.id}`, icon: Users, label: 'Misafirler' },
          { href: '/eventjoy/mesajlar', icon: MessageCircle, label: 'Mesajlar' }
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2 rounded-xl border py-4 text-center"
          >
            <item.icon className="size-5 text-[#E53935]" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
