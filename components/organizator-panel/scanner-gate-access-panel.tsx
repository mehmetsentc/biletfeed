'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, KeyRound, Link2, QrCode, RefreshCw, X } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { getGirisUrl } from '@/lib/config/domain';

type GateCodeRow = {
  pin: string;
  redeemCode?: string;
  expiresAt: string;
  createdAt: string;
  eventId?: string;
  eventTitle?: string;
};

type OrganizerEventOption = {
  id: string;
  title: string;
};

type ScannerGateAccessPanelProps = {
  events: OrganizerEventOption[];
  selectedEventId: string;
  onEventChange: (eventId: string) => void;
};

export function ScannerGateAccessPanel({
  events,
  selectedEventId,
  onEventChange
}: ScannerGateAccessPanelProps) {
  const [codes, setCodes] = useState<GateCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [showQr, setShowQr] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const canCreateCode = selectedEventId !== 'all' && Boolean(selectedEvent);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/organizer/scanner-gate', {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = (await res.json().catch(() => ({}))) as {
        codes?: GateCodeRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? 'Kodlar yüklenemedi');
        return;
      }
      const rows = (data.codes ?? []).map((row) => ({
        ...row,
        eventTitle:
          row.eventTitle ??
          events.find((e) => e.id === row.eventId)?.title
      }));
      setCodes(rows);
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }, [events]);

  useEffect(() => {
    void loadCodes();
  }, [loadCodes]);

  const activeCode = codes[0];
  const shareCode = activeCode?.pin ?? null;
  const gateLink = shareCode
    ? `${getGirisUrl('/')}?gate=${encodeURIComponent(shareCode)}`
    : null;

  useEffect(() => {
    if (!showQr || !gateLink || !qrCanvasRef.current) return;
    void QRCode.toCanvas(qrCanvasRef.current, gateLink, {
      width: 200,
      margin: 2,
      color: { dark: '#ffffff', light: '#11151c' }
    });
  }, [showQr, gateLink]);

  async function copyText(text: string, kind: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Kopyalanamadı');
    }
  }

  async function createCode() {
    if (!canCreateCode) {
      setError('Önce kapı kodu için bir etkinlik seçin');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/organizer/scanner-gate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEventId })
      });
      const data = (await res.json().catch(() => ({}))) as {
        pin?: string;
        redeemCode?: string;
        code?: string;
        expiresAt?: string;
        eventId?: string;
        eventTitle?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? 'Kod oluşturulamadı');
        return;
      }

      const redeemCode = data.redeemCode ?? data.code;
      if (data.pin && data.expiresAt) {
        setCodes((prev) => [
          {
            pin: data.pin!,
            redeemCode,
            expiresAt: data.expiresAt!,
            createdAt: new Date().toISOString(),
            eventId: data.eventId ?? selectedEventId,
            eventTitle: data.eventTitle ?? selectedEvent?.title
          },
          ...prev
        ]);
        await copyText(data.pin!, 'code');
      } else {
        await loadCodes();
      }
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setCreating(false);
    }
  }

  async function pruneStaleCodes() {
    setPruning(true);
    setError(null);
    try {
      const res = await fetch('/api/organizer/scanner-gate', {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = (await res.json().catch(() => ({}))) as {
        codes?: GateCodeRow[];
        removed?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? 'Eski kodlar temizlenemedi');
        return;
      }
      setCodes(data.codes ?? []);
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setPruning(false);
    }
  }

  return (
    <div className="border-b border-white/10 bg-[#11151c] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <KeyRound className="size-4 shrink-0 text-primary" />
            Kapı ekibi erişimi
          </div>
          <p className="mt-1 text-xs text-white/55">
            Kod yalnızca seçili etkinlik için geçerlidir. Görevliler{' '}
            <span className="text-primary">giris.biletfeed.com</span> üzerinden giriş yapar
            (3 gün geçerli).
          </p>
          {events.length > 0 && (
            <div className="mt-3">
              <label htmlFor="gate-event-select" className="mb-1.5 block text-xs text-white/50">
                Kapı kodu etkinliği
              </label>
              <select
                id="gate-event-select"
                value={selectedEventId}
                onChange={(e) => onEventChange(e.target.value)}
                className="h-10 w-full max-w-md rounded-md border border-white/20 bg-white/5 px-3 text-sm text-white"
              >
                <option value="all">Etkinlik seçin…</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 border-white/20 bg-transparent text-white hover:bg-white/10"
          onClick={() => void createCode()}
          disabled={creating || pruning || !canCreateCode}
        >
          {creating ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : activeCode ? (
            'Yeni kod'
          ) : (
            'Kod oluştur'
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-xs text-red-300">{error}</p>
          {error.includes('aktif kapı kodu') && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 border-white/20 bg-transparent px-2 text-xs text-white hover:bg-white/10"
              onClick={() => void pruneStaleCodes()}
              disabled={pruning}
            >
              {pruning ? 'Temizleniyor…' : 'Eski kodları temizle'}
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <p className="mt-2 text-xs text-white/45">Yükleniyor…</p>
      ) : activeCode ? (
        <div className="mt-3 space-y-2">
          {(activeCode.eventTitle || activeCode.eventId) && (
            <p className="text-xs text-amber-200/90">
              Etkinlik:{' '}
              <span className="font-medium text-white">
                {activeCode.eventTitle ??
                  events.find((e) => e.id === activeCode.eventId)?.title ??
                  'Seçili etkinlik'}
              </span>
            </p>
          )}
          {shareCode && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#0c1017] px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-white/45">
                  Kapı kodu
                </p>
                <p className="font-mono text-xl font-bold tracking-[0.2em] text-primary">
                  {shareCode}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => void copyText(shareCode, 'code')}
              >
                <Copy className="mr-1.5 size-4" />
                {copied === 'code' ? 'Kopyalandı' : 'Kodu kopyala'}
              </Button>
            </div>
          )}
          <p className="text-[11px] text-white/45">
            Görevli <span className="text-primary">giris.biletfeed.com</span> adresine
            bu 10 haneli kodu girer ya da giriş linkini/QR'ı kullanır.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-primary text-black hover:bg-primary/90"
              onClick={() => setShowQr((v) => !v)}
            >
              <QrCode className="mr-1.5 size-4" />
              {showQr ? 'QR kodu kapat' : 'QR kod göster'}
            </Button>
            {gateLink && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => void copyText(gateLink, 'link')}
              >
                <Link2 className="mr-1.5 size-4" />
                {copied === 'link' ? 'Kopyalandı' : 'Giriş linki'}
              </Button>
            )}
          </div>

          {showQr && gateLink && (
            <div className="relative mt-2 flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-[#0c1017] p-4">
              <button
                type="button"
                onClick={() => setShowQr(false)}
                className="absolute right-2 top-2 text-white/40 hover:text-white/70"
                aria-label="Kapat"
              >
                <X className="size-4" />
              </button>
              <canvas ref={qrCanvasRef} className="rounded" />
              <p className="text-center text-xs text-white/50">
                giris.biletfeed.com adresine yönlendirir
              </p>
              <p className="text-center text-xs text-amber-300/80">
                Kapı görevlisi bu QR ile yalnızca seçili etkinliği tarayabilir
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-white/45">
          {canCreateCode
            ? 'Seçili etkinlik için kapı kodu oluşturun.'
            : 'Kod oluşturmak için önce bir etkinlik seçin.'}
        </p>
      )}
    </div>
  );
}
