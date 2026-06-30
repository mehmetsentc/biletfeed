'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TicketTransferForm({ ticketId }: { ticketId: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toEmail: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Devir başarısız');
      setMessage('Bilet devri başlatıldı. Alıcıya e-posta gönderildi.');
      setEmail('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold">Bileti Devret</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Biletinizi başka bir e-posta adresine devredebilirsiniz.
      </p>
      <div className="mt-3 space-y-2">
        <Label htmlFor="transfer-email">Alıcı e-posta</Label>
        <Input
          id="transfer-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@email.com"
        />
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {message && <p className="mt-2 text-sm text-emerald-600">{message}</p>}
      <Button
        className="mt-3"
        variant="outline"
        disabled={loading || !email.trim()}
        onClick={() => void submit()}
      >
        {loading ? 'Gönderiliyor…' : 'Devret'}
      </Button>
    </div>
  );
}
