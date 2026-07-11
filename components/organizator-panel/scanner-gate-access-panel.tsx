'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type GateCodeRow = {
  code: string;
  expiresAt: string;
  createdAt: string;
};

export function ScannerGateAccessPanel() {
  const [codes, setCodes] = useState<GateCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
        code?: string;
        expiresAt?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? 'Kod oluşturulamadı');
        return;
      }
      if (data.code && data.expiresAt) {
        setCodes((prev) => [
          { code: data.code!, expiresAt: data.expiresAt!, createdAt: new Date().toISOString() },
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

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setError('Kod kopyalanamadı');
    }
  }

  const activeCode = codes[0];

  return (
    <div className="border-b border-white/10 bg-[#11151c] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <KeyRound className="size-4 shrink-0 text-primary" />
            Kapı ekibi kodu
          </div>
          <p className="mt-1 text-xs text-white/55">
            Ekibiniz panele şifre girmeden bu kodla giriş yapar. Aynı kodu 10 kişiye
            kadar paylaşabilirsiniz (12 saat geçerli).
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
        <div className="mt-3 flex items-center gap-2">
          <code className="rounded-lg bg-black/40 px-4 py-2 text-2xl font-bold tracking-[0.3em] text-primary">
            {activeCode.code}
          </code>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => void copyCode(activeCode.code)}
            aria-label="Kodu kopyala"
          >
            <Copy className="size-4" />
          </Button>
          {copiedCode === activeCode.code && (
            <span className="text-xs text-primary">Kopyalandı</span>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-white/45">
          Henüz aktif kod yok. Kapı görevlileri için kod oluşturun.
        </p>
      )}
    </div>
  );
}
