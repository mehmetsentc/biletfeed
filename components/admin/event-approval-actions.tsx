'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventApprovalActionsProps {
  eventId: string;
  eventTitle: string;
}

export function EventApprovalActions({ eventId, eventTitle }: EventApprovalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: 'approve' | 'reject') {
    if (
      action === 'reject' &&
      !confirm(`"${eventTitle}" etkinliğini reddetmek istediğinize emin misiniz?`)
    ) {
      return;
    }

    setLoading(action);
    setError(null);

    const res = await fetch(`/api/admin/events/${eventId}/${action}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: action === 'reject' ? JSON.stringify({}) : undefined
    });
    const body = (await res.json()) as { error?: string };
    setLoading(null);

    if (!res.ok) {
      setError(body.error || 'İşlem başarısız');
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="gap-1.5"
          disabled={loading !== null}
          onClick={() => void handleAction('approve')}
        >
          <CheckCircle className="size-3.5" />
          {loading === 'approve' ? 'Onaylanıyor…' : 'Onayla'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-destructive hover:text-destructive"
          disabled={loading !== null}
          onClick={() => void handleAction('reject')}
        >
          <XCircle className="size-3.5" />
          {loading === 'reject' ? 'Reddediliyor…' : 'Reddet'}
        </Button>
      </div>
    </div>
  );
}
