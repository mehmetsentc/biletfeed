'use client';

import { useState, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function parseDownloadFilename(
  disposition: string | null,
  fallback: string
): string {
  if (!disposition) return fallback;
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) return decodeURIComponent(utf8);
  const quoted = disposition.match(/filename="([^"]+)"/i)?.[1];
  if (quoted) return quoted;
  const plain = disposition.match(/filename=([^;]+)/i)?.[1];
  return plain?.trim() ?? fallback;
}

export function OrganizerCsvDownloadButton({
  href,
  fallbackFilename,
  label,
  icon: Icon,
  variant = 'outline',
  size = 'sm',
  className
}: {
  href: string;
  fallbackFilename: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  variant?: 'outline' | 'secondary' | 'default';
  size?: 'sm' | 'default';
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(href, {
        credentials: 'include',
        headers: { Accept: 'text/csv, application/json' }
      });
      const contentType = res.headers.get('content-type') ?? '';

      if (!res.ok) {
        if (contentType.includes('application/json')) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? `Rapor indirilemedi (${res.status})`);
        }
        throw new Error(`Rapor indirilemedi (${res.status})`);
      }

      // Oturum düşmüşse HTML login sayfası dönebilir
      if (contentType.includes('text/html')) {
        throw new Error('Oturum süresi dolmuş olabilir. Sayfayı yenileyip tekrar deneyin.');
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error('Rapor boş geldi. Lütfen tekrar deneyin.');
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = parseDownloadFilename(
        res.headers.get('Content-Disposition'),
        fallbackFilename.endsWith('.csv') ? fallbackFilename : `${fallbackFilename}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'Rapor indirilemedi. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn('justify-start gap-2', className)}
      disabled={loading}
      onClick={() => void handleDownload()}
    >
      {Icon && <Icon className="size-3.5" />}
      {loading ? 'İndiriliyor…' : label}
    </Button>
  );
}
