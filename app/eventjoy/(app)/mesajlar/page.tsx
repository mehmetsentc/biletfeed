import Link from 'next/link';
import { mockEventJoyMessages } from '@/lib/data/mock-eventjoy';

export default function MessagesPage() {
  return (
    <div className="bg-white px-4 py-6">
      <h1 className="text-2xl font-bold">Mesajlar</h1>

      <ul className="mt-6 divide-y">
        {mockEventJoyMessages.map((msg) => (
          <li key={msg.id}>
            <Link
              href={`/eventjoy/mesajlar/${msg.eventId}`}
              className="flex items-center gap-4 py-4"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                {msg.eventTitle.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{msg.eventTitle}</p>
                <p className="truncate text-sm text-muted-foreground">{msg.message}</p>
              </div>
              {msg.time && (
                <span className="text-xs text-muted-foreground">{msg.time}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
