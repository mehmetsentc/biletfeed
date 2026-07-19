'use client';

import { useState } from 'react';
import { MoreVertical, Send } from 'lucide-react';
import { EventJoyHeader } from '@/components/eventjoy/mobile-shell';
import type { EventJoyEvent } from '@/lib/eventjoy/types';

export function MessageChatClient({ event }: { event: EventJoyEvent }) {
  const [message, setMessage] = useState('');

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col bg-white">
      <EventJoyHeader
        title={event.title}
        backHref="/eventjoy/mesajlar"
        rightAction={
          <button type="button" aria-label="Menü">
            <MoreVertical className="size-5" />
          </button>
        }
      />
      <p className="border-b px-4 pb-2 text-center text-xs text-muted-foreground">
        {event.guestCount} Katılımcı
      </p>

      <div className="flex flex-1 flex-col items-center justify-end px-4 pb-4">
        <p className="mb-8 text-center text-xs text-muted-foreground">
          Mesajlar her misafire özel olarak gönderilir.
        </p>
      </div>

      <div className="flex items-center gap-2 border-t px-4 py-3">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mesaj yazın"
          className="flex-1 rounded-full border bg-muted/30 px-4 py-2.5 text-sm outline-none"
        />
        <button type="button" className="text-[var(--bf-accent-ink)]" aria-label="Gönder">
          <Send className="size-5" />
        </button>
      </div>
    </div>
  );
}
