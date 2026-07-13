'use client';

import { useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Link2, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const MAX_BYTES = 5 * 1024 * 1024;

type ImageMode = 'file' | 'url';

type AdminImageSourceFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  uploadScope?: 'events' | 'feed' | 'banners';
  hint?: string;
  className?: string;
};

function isHttpImageUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Sadece görsel dosyaları yüklenebilir.';
  }
  if (file.size > MAX_BYTES) {
    return 'Dosya 5 MB sınırını aşıyor.';
  }
  return null;
}

export function AdminImageSourceField({
  label,
  value,
  onChange,
  uploadScope = 'banners',
  hint,
  className
}: AdminImageSourceFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImageMode>('file');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('scope', uploadScope);
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin'
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Yükleme başarısız');
      onChange(data.url!);
      setMode('file');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  }

  function applyUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError('Görsel linki girin.');
      return;
    }
    if (!isHttpImageUrl(trimmed)) {
      setError('Geçerli bir http veya https linki girin.');
      return;
    }
    setError(null);
    onChange(trimmed);
    setMode('url');
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-xs">{label}</Label>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}

      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setMode('file')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
            mode === 'file'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Upload className="size-3.5" />
          Cihazdan yükle
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('url');
            if (value.startsWith('http')) setUrlInput(value);
          }}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
            mode === 'url'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Link2 className="size-3.5" />
          Linkten ekle
        </button>
      </div>

      {mode === 'file' ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Yükleniyor…
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                Görsel seç
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="url"
            placeholder="https://…"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyUrl();
              }
            }}
          />
          <Button type="button" variant="secondary" size="sm" onClick={applyUrl}>
            Uygula
          </Button>
        </div>
      )}

      {value ? (
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg border border-border bg-muted/20">
          <Image
            src={value}
            alt=""
            fill
            className="object-cover"
            unoptimized
            onError={() => setError('Önizleme yüklenemedi.')}
          />
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
