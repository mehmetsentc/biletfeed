'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

type Status = 'idle' | 'running' | 'success' | 'error';

interface ScrapeNowButtonProps {
  /** Server action — geçirilir, client sırrı yoktur */
  onScrape: () => Promise<{ ok: boolean; message: string }>;
}

export function ScrapeNowButton({ onScrape }: ScrapeNowButtonProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleClick() {
    setStatus('running');
    setMessage('');
    try {
      const result = await onScrape();
      if (result.ok) {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.message || 'Scrape başarısız');
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
