'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdminTicketRow {
  id: string;
  ticketCode: string;
  status: string;
  entryCount: number;
  attendeeName: string | null;
  attendeeEmail: string | null;
  event: { title: string };
  ticketType: { name: string };
  user: { displayName: string; email: string };
}

export function AdminTicketSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [results, setResults] = useState<AdminTicketRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/tickets?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Arama başarısız');
      setResults(data.tickets ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Arama başarısız');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function runAction(ticketId: string, action: 'force_check_in' | 'cancel' | 'regenerate_qr') {
    setActionLoading(`${ticketId}-${action}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'İşlem başarısız');
      setMessage(
        action === 'regenerate_qr'
          ? `QR yenilendi: ${data.ticketCode ?? ticketId}`
          : data.message || 'İşlem tamamlandı'
      );
      void search();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Hata');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Bilet kodu, isim, e-posta, token..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void search()}
        />
        <Button onClick={() => void search()} disabled={loading}>
          {loading ? 'Aranıyor...' : 'Ara'}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Kod</th>
              <th className="p-3 font-medium">Etkinlik</th>
              <th className="p-3 font-medium">Sahip</th>
              <th className="p-3 font-medium">Durum</th>
              <th className="p-3 font-medium">Giriş</th>
              <th className="p-3 font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {results.map((ticket) => (
              <tr key={ticket.id} className="border-b last:border-0">
                <td className="p-3 font-mono text-xs">{ticket.ticketCode}</td>
                <td className="p-3">{ticket.event.title}</td>
                <td className="p-3">
                  {ticket.attendeeName || ticket.user.displayName}
                  <span className="block text-xs text-muted-foreground">
                    {ticket.attendeeEmail || ticket.user.email}
                  </span>
                </td>
                <td className="p-3">
                  <Badge variant={ticket.status === 'VALID' ? 'success' : 'secondary'}>
                    {ticket.status}
                  </Badge>
                </td>
                <td className="p-3">{ticket.entryCount}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!!actionLoading}
                      onClick={() => void runAction(ticket.id, 'force_check_in')}
                    >
                      Giriş
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!!actionLoading || ticket.status !== 'VALID'}
                      onClick={() => void runAction(ticket.id, 'cancel')}
                    >
                      İptal
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!!actionLoading}
                      onClick={() => void runAction(ticket.id, 'regenerate_qr')}
                    >
                      QR Yenile
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {results.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Sonuç yok. Arama yapın.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
