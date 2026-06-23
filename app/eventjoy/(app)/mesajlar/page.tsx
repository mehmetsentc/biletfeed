import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { mockEventJoyMessages } from '@/lib/data/mock-eventjoy';

export default function MessagesPage() {
  return (
    <div className="space-y-6 px-4 py-6 lg:px-0 lg:py-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Mesajlar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Etkinlik gruplarınızdaki sohbetler
        </p>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {mockEventJoyMessages.map((msg) => (
          <li key={msg.id}>
            <Link
              href={`/eventjoy/mesajlar/${msg.eventId}`}
              className="flex items-center gap-4 px-5 py-4 transition hover:bg-muted/50"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {msg.eventTitle.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{msg.eventTitle}</p>
                <p className="truncate text-sm text-muted-foreground">{msg.message}</p>
              </div>
              {msg.time && (
                <span className="shrink-0 text-xs text-muted-foreground">{msg.time}</span>
              )}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
