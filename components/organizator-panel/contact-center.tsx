'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { platformContact } from '@/lib/config/contact';

type TicketRow = {
  id: string;
  subject: string;
  body: string;
  status: string;
  reply: string | null;
  createdAt: string;
};

export function ContactCenter({ initialTickets }: { initialTickets: TicketRow[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/organizer/support', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Gönderilemedi');
      return;
    }
    setTickets((prev) => [data.ticket, ...prev]);
    setSubject('');
    setBody('');
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Destek Talebi Oluştur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Platform desteği:{' '}
            <a
              href={`mailto:${platformContact.email}`}
              className="text-[#f5a623] underline"
            >
              {platformContact.email}
            </a>
          </p>
          <form onSubmit={submitTicket} className="space-y-4">
            <div className="space-y-2">
              <Label>Konu</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Mesaj</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="bg-[#f5a623] text-black hover:bg-[#e09510]">
              {loading ? 'Gönderiliyor…' : 'Talep Gönder'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left">
            <tr>
              <th className="p-3 font-medium">Tarih</th>
              <th className="p-3 font-medium">Konu</th>
              <th className="p-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap text-muted-foreground">
                  {new Date(t.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="p-3">
                  <p className="font-medium">{t.subject}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.body}</p>
                </td>
                <td className="p-3">
                  <Badge variant={t.status === 'open' ? 'secondary' : 'success'}>
                    {t.status === 'open' ? 'Açık' : t.status === 'replied' ? 'Yanıtlandı' : 'Kapalı'}
                  </Badge>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">
                  Henüz destek talebi yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
