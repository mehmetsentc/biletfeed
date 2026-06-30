'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: string;
};

export function NotificationsPageClient({
  initialNotifications
}: {
  initialNotifications: NotificationItem[];
}) {
  const [items, setItems] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ all: true })
      });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id })
    });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      {unread > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled={loading} onClick={() => void markAllRead()}>
            Tümünü okundu işaretle
          </Button>
        </div>
      )}
      <div className="space-y-3">
        {items.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => void markRead(n.id)}
            className={`w-full rounded-xl border p-4 text-left transition-colors ${
              !n.read ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              </div>
              {!n.read && (
                <Badge variant="default" className="shrink-0">
                  Yeni
                </Badge>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{n.time}</p>
          </button>
        ))}
        {items.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Henüz bildirim yok.
          </p>
        )}
      </div>
    </div>
  );
}
