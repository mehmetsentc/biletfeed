'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Download,
  Loader2,
  Upload,
  Users
} from 'lucide-react';
import { MAX_DIRECT_INVITATION_PDFS } from '@/lib/config/invitations';
import type { InvitationRow } from '@/lib/services/event-invitations';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type GuestDraft = {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
};

function parseCsvGuests(text: string): GuestDraft[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    return {
      guestName: parts[0] ?? '',
      guestEmail: parts[1] ?? '',
      guestPhone: parts[2] ?? ''
    };
  }).filter((g) => g.guestName.length >= 2);
}

export function BulkInvitationsPanel({
  eventId,
  ticketTypeId,
  disabled,
  onCreated
}: {
  eventId: string;
  ticketTypeId: string;
  disabled?: boolean;
  onCreated: (rows: InvitationRow[]) => void;
}) {
  const [csvText, setCsvText] = useState('');
  const [sendEmails, setSendEmails] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<InvitationRow[]>([]);
  const [zipLoading, setZipLoading] = useState(false);

  const preview = parseCsvGuests(csvText);

  async function handleBulkSend() {
    if (!eventId || !ticketTypeId || preview.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/organizer/invitations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventId,
          ticketTypeId,
          sendEmails,
          guests: preview
        })
      });
      const data = (await res.json()) as {
        error?: string;
        created?: InvitationRow[];
        errors?: Array<{ guestName: string; error: string }>;
      };
      if (!res.ok) throw new Error(data.error || 'Toplu gönderim başarısız');

      const created = data.created ?? [];
      setLastCreated(created);
      onCreated(created);
      setCsvText('');

      if (created.length > 0) {
        await downloadZipForIds(created.map((r) => r.id));
      }

      if (data.errors?.length) {
        setError(
          `${created.length} davetiye oluşturuldu, ${data.errors.length} hata: ${data.errors
            .map((e) => e.guestName)
            .join(', ')}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toplu gönderim başarısız');
    } finally {
      setLoading(false);
    }
  }

  async function downloadZipForIds(ids: string[]) {
    setZipLoading(true);
    try {
      const res = await fetch('/api/organizer/invitations/bulk/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ invitationIds: ids })
      });
      if (!res.ok) throw new Error('ZIP oluşturulamadı');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BiletFeed-Davetiyeler.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ZIP indirilemedi');
    } finally {
      setZipLoading(false);
    }
  }

  async function downloadZip() {
    if (lastCreated.length === 0) return;
    await downloadZipForIds(lastCreated.map((r) => r.id));
  }

  const overDirectLimit = preview.length > MAX_DIRECT_INVITATION_PDFS;

  return (
    <div className="rounded-xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Users className="size-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Toplu Davetiye</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Her satır için ayrı PDF oluşturulur. Çoklu paylaşımda otomatik ZIP indirilir.
      </p>

      {overDirectLimit && (
        <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {MAX_DIRECT_INVITATION_PDFS} kişiden fazla davetiyede doğrudan PDF paylaşımı
            önerilmez. Sistem otomatik ZIP oluşturacaktır.
          </span>
        </div>
      )}

      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="bulk-csv">Misafir listesi (Ad, E-posta, Telefon)</Label>
          <textarea
            id="bulk-csv"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Ahmet Yılmaz, ahmet@email.com, 05551234567\nAyşe Demir, ayse@email.com`}
            className="mt-1.5 min-h-[140px] w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {preview.length} misafir algılandı · virgül veya noktalı virgül ile ayırın
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={sendEmails}
            onChange={(e) => setSendEmails(e.target.checked)}
            className="size-4 rounded border-border"
          />
          E-posta adresi olanlara PDF ekli davetiye gönder
        </label>

        <Button
          type="button"
          className="w-full"
          disabled={disabled || loading || preview.length === 0}
          onClick={() => void handleBulkSend()}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {preview.length} davetiye oluşturuluyor...
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              Toplu Oluştur ({preview.length})
            </>
          )}
        </Button>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {lastCreated.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium text-foreground">
              {lastCreated.length} davetiye hazır
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={zipLoading}
              onClick={() => void downloadZip()}
            >
              {zipLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Tüm PDF&apos;leri ZIP İndir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
