'use client';

import { use } from 'react';
import Link from 'next/link';
import { useEventJoy } from '@/components/providers/eventjoy-provider';
import { GuestListClient } from '@/components/eventjoy/guest-list-client';

export function EventJoyGuestListPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ready, getEvent } = useEventJoy();
  const event = getEvent(id);

  if (!ready) return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  if (!event) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="font-semibold">Etkinlik bulunamadı</p>
        <Link href="/eventjoy/etkinlikler" className="mt-2 text-sm text-[var(--bf-accent-ink)]">
          Geri dön
        </Link>
      </div>
    );
  }

  return <GuestListClient event={event} />;
}
