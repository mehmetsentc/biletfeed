'use client';

import { useState } from 'react';
import { EventJoyHeader } from '@/components/eventjoy/mobile-shell';

const notifications = [
  {
    id: 'rsvp',
    title: 'RSVP Bildirimleri',
    desc: 'Misafirler etkinliğe yanıt verdiğinde bildirim alın.'
  },
  {
    id: 'activity',
    title: 'Aktivite Bildirimleri',
    desc: 'Bir misafir size yanıt verdiğinde, sizi etiketlediğinde bildirim alın.'
  },
  {
    id: 'deadline',
    title: 'Son Tarih Bildirimleri',
    desc: 'Görev son tarihleri yaklaştığında bildirim alın.'
  }
];

export default function NotificationsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    rsvp: true,
    activity: true,
    deadline: true
  });

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-white">
      <EventJoyHeader title="Bildirimler" backHref="/eventjoy/profil" />

      <ul className="divide-y">
        {notifications.map((n) => (
          <li key={n.id} className="flex items-start justify-between gap-4 px-4 py-5">
            <div>
              <p className="font-semibold">{n.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{n.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled[n.id]}
              onClick={() =>
                setEnabled((prev) => ({ ...prev, [n.id]: !prev[n.id] }))
              }
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                enabled[n.id] ? 'bg-[#E53935]' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
                  enabled[n.id] ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
