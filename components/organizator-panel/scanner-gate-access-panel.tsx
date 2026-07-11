'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Link2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { panelLoginHref } from '@/lib/config/domain';

type GateCodeRow = {
  pin: string;
  redeemCode?: string;
  expiresAt: string;
  createdAt: string;
};

export function ScannerGateAccessPanel() {
  const [codes, setCodes] = useState<GateCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

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
      setCodes(data.codes ?? []);
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCodes();
  }, [loadCodes]);

  async function createCode() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/organizer/scanner-gate', {
        method: 'POST',
        credentials: 'include'
      });
      const data = (await res.json().catch(() => ({}))) as {
        pin?: string;
        redeemCode?: string;
        code?: string;
        expiresAt?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? 'Kod oluşturulamadı');
        return;
      }

      const redeemCode = data.redeemCode ?? data.code;
      if (data.pin && redeemCode && data.expiresAt) {
        setCodes((prev) => [
          {
            pin: data.pin!,
            redeemCode,
            expiresAt: data.expiresAt!,
            createdAt: new Date().toISOString()
          },
          ...prev
        ]);
      } else {
        await loadCodes();
      }
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setCreating(false);
    }
  }

  const activeCode = codes[0];
  const gateLink = activeCode?.redeemCode
    ? `${panelLoginHref().replace(/\?.*$/, '')}?gate=${encodeURIComponent(activeCode.redeemCode)}`
    : null;

  async function copyText(text: string, kind: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Kopyalanamadı');
    }
  }

  return (
    <div className="border-b border-white/10 bg-[#11151c] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <KeyRound className="size-4 shrink-0 text-primary" />
            Kapı ekibi kodu
          </div>
          <p className="mt-1 text-xs text-white/55">
            <strong className="text-white/75">Kodu kopyala</strong> ile ekibe WhatsApp&apos;tan
            gönderin. Görevliler tam kodu yapıştırarak giriş yapar (12 saat geçerli).
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 border-white/20 bg-transparent text-white hover:bg-white/10"
          onClick={() => void createCode()}
          disabled={creating}
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

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

      {loading ? (
        <p className="mt-2 text-xs text-white/45">Yükleniyor…</p>
      ) : activeCode ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <code className="rounded-lg bg-black/40 px-4 py-2 text-2xl font-bold tracking-[0.3em] text-primary">
              {activeCode.pin}
            </code>
            <span className="text-xs text-white/45">referans</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeCode.redeemCode && (
              <Button
                type="button"
                size="sm"
                className="bg-primary text-black hover:bg-primary/90"
                onClick={() => void copyText(activeCode.redeemCode!, 'code')}
              >
                <Copy className="mr-1.5 size-4" />
                {copied === 'code' ? 'Kopyalandı' : 'Kodu kopyala'}
              </Button>
            )}
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
        </div>
      ) : (
        <p className="mt-2 text-xs text-white/45">
          Henüz aktif kod yok. Kapı görevlileri için kod oluşturun.
        </p>
      )}
    </div>
  );
}
