'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Link2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGirisUrl } from '@/lib/config/domain';

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
  const [pruning, setPruning] = useState(false);
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
        await copyText(redeemCode, 'code');
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

  const activeCode = codes[0];
  const gateLink = activeCode?.redeemCode
    ? `${getGirisUrl('/')}?gate=${encodeURIComponent(activeCode.redeemCode)}`
    : null;

  return (
    <div className="border-b border-white/10 bg-[#11151c] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <KeyRound className="size-4 shrink-0 text-primary" />
            Kapı ekibi kodu
          </div>
          <p className="mt-1 text-xs text-white/55">
            <strong className="text-white/75">Kodu kopyala</strong> veya{' '}
            <strong className="text-white/75">Giriş linki</strong> ile ekibe gönderin.
            Görevliler <span className="text-primary">giris.biletfeed.com</span>{' '}
            üzerinden giriş yapar (3 gün geçerli).
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 border-white/20 bg-transparent text-white hover:bg-white/10"
          onClick={() => void createCode()}
          disabled={creating || pruning}
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
          <p className="text-xs text-amber-200/90">
            Kısa referans ({activeCode.pin}) giriş için yeterli değildir — tam kodu veya
            linki paylaşın.
          </p>
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
