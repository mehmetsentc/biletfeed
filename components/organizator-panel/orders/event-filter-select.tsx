'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface EventOption {
  id: string;
  title: string;
  startDate: Date;
}

interface EventFilterSelectProps {
  events: EventOption[];
  selectedEventId?: string;
}

export function EventFilterSelect({ events, selectedEventId }: EventFilterSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set('eventId', e.target.value);
    } else {
      params.delete('eventId');
    }
    // Reset category when changing event
    params.delete('category');
    router.push(`/organizator-panel/siparisler?${params.toString()}`);
  }

  return (
    <div className="relative">
      <select
        value={selectedEventId ?? ''}
        onChange={handleChange}
        className="h-10 w-full appearance-none rounded-lg border border-border bg-background pr-9 pl-3 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-72"
      >
        <option value="">Tüm Etkinlikler</option>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.title} —{' '}
            {new Date(ev.startDate).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
