'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

type Status = 'idle' | 'running' | 'success' | 'error';

interface ScrapeStats {
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFetched?: number;
  errors?: string[];
}

function formatScrapeMessage(stats: ScrapeStats, status?: string): string {
  const parts = [
    `${stats.totalCreated} yeni`,
    `${stats.totalUpdated} güncellendi`,
    `${stats.totalSkipped} atlandı`,
  ];
  if (stats.totalFetched != null) {
    parts.unshift(`${stats.totalFetched} çekildi`);
  }
  let msg = parts.join(' · ');
  if (status === 'partial') {
    msg += ' (kısmi — bazı hatalar oluştu)';
  }
  return msg;
}

async function pollScrapeRun(runId: string): Promise<{
  ok: boolean;
  status?: string;
  stats?: ScrapeStats;
  error?: string;
}> {
  const maxAttempts = 120; // ~6 dk (3s aralık)
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`/api/admin/scrape-now?runId=${encodeURIComponent(runId)}`, {
      credentials: 'include',
    });
    const data = (await res.json()) as {
      ok?: boolean;
      finished?: boolean;
      status?: string;
      stats?: ScrapeStats;
      error?: string;
    };

    if (!res.ok) {
      return { ok: false, error: data.error ?? `Sunucu hatası (${res.status})` };
    }

    if (data.finished && data.stats) {
      return { ok: Boolean(data.ok), status: data.status, stats: data.stats };
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  return { ok: false, error: 'Scrape zaman aşımı — arka planda devam ediyor olabilir' };
}

export function ScrapeNowButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleClick() {
    setStatus('running');
    setMessage('Tüm Bubilet şehirleri taranıyor — birkaç dakika sürebilir…');

    try {
      const res = await fetch('/api/admin/scrape-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      let data: {
        ok?: boolean;
        error?: string;
        runId?: string;
        status?: string;
        stats?: ScrapeStats;
        finished?: boolean;
      } | null = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setStatus('error');
        setMessage(data?.error ?? `Sunucu hatası (${res.status})`);
        return;
      }

      if (data?.finished && data.stats) {
        if (data.ok) {
          setStatus('success');
          setMessage(formatScrapeMessage(data.stats, data.status));
          router.refresh();
        } else {
          setStatus('error');
          const err = data.stats.errors?.[0];
          setMessage(err ? `Başarısız: ${err}` : 'Scrape başarısız');
        }
        return;
      }

      if (!data?.runId) {
        setStatus('error');
        setMessage('Beklenmeyen sunucu yanıtı');
        return;
      }

      const result = await pollScrapeRun(data.runId);

      if (result.ok && result.stats) {
        setStatus('success');
        setMessage(formatScrapeMessage(result.stats, result.status));
        router.refresh();
      } else {
        setStatus('error');
        setMessage(result.error ?? result.stats?.errors?.[0] ?? 'Scrape başarısız');
      }
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        onClick={handleClick}
        disabled={status === 'running'}
        variant="default"
        className="gap-2"
      >
        <RefreshCw className={`size-4 ${status === 'running' ? 'animate-spin' : ''}`} />
        {status === 'running' ? 'Scrape ediliyor…' : 'Şimdi Scrape Et'}
      </Button>
      {status === 'running' && message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
      {status === 'success' && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 className="size-3.5" />
          {message}
        </p>
      )}
      {status === 'error' && (
        <p className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle className="size-3.5" />
          {message || 'Scrape başarısız'}
        </p>
      )}
    </div>
  );
}
