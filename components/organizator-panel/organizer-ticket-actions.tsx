'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function OrganizerTicketActions({
  ticketId,
  ticketCode,
  status
}: {
  ticketId: string;
  ticketCode: string;
  status: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function resend() {
    setLoading('resend');
    setMessage(null);
    try {
      const res = await fetch(`/api/organizer/tickets/${ticketId}/resend`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage('E-posta gönderildi');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(null);
    }
  }

  async function checkIn() {
    setLoading('checkin');
    setMessage(null);
    try {
      const res = await fetch(`/api/organizer/tickets/${ticketId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      setMessage(data.message || 'Giriş kaydedildi');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={!!loading}
          onClick={() => void resend()}
        >
          {loading === 'resend' ? '…' : 'Yeniden Gönder'}
        </Button>
        {status === 'VALID' && (
          <Button
            variant="outline"
            size="sm"
            disabled={!!loading}
            onClick={() => void checkIn()}
          >
            {loading === 'checkin' ? '…' : 'Giriş Yap'}
          </Button>
        )}
      </div>
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
      <span className="font-mono text-[10px] text-muted-foreground">{ticketCode}</span>
    </div>
  );
}
