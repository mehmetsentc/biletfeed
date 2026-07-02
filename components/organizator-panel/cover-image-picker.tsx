'use client';

import { useCallback, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { ImageIcon, Link2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const MAX_BYTES = 5 * 1024 * 1024;

type ImageMode = 'file' | 'url';

export type CoverImagePickerProps = {
  previewUrl: string | null;
  onPreviewChange: (url: string | null) => void;
  onFileChange: (file: File | null) => void;
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
    return 'Sadece görsel dosyaları yüklenebilir (JPG, PNG, WebP).';
  }
  if (file.size > MAX_BYTES) {
    return 'Dosya 5 MB sınırını aşıyor.';
  }
  return null;
}

export function CoverImagePicker({
  previewUrl,
  onPreviewChange,
  onFileChange,
  className
}: CoverImagePickerProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImageMode>('file');
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const applyFile = useCallback(
    (file: File) => {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      onFileChange(file);
      onPreviewChange(URL.createObjectURL(file));
      setMode('file');
    },
    [onFileChange, onPreviewChange]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (file) applyFile(file);
    },
    [applyFile]
  );

  const handleUrlApply = () => {
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
    onFileChange(null);
    onPreviewChange(trimmed);
    setMode('url');
  };

  const clearImage = () => {
    onFileChange(null);
    onPreviewChange(null);
    setUrlInput('');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const switchMode = (next: ImageMode) => {
    setMode(next);
    setError(null);
    if (next === 'url' && previewUrl?.startsWith('http')) {
      setUrlInput(previewUrl);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex gap-2 rounded-lg border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => switchMode('file')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            mode === 'file'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Upload className="size-4" />
          Dosya yükle
        </button>
        <button
          type="button"
          onClick={() => switchMode('url')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            mode === 'url'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Link2 className="size-4" />
          Link ile ekle
        </button>
      </div>

      {mode === 'file' ? (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOver(false);
            }
          }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all',
            previewUrl
              ? 'border-primary/40 bg-primary/5 p-2'
              : dragOver
                ? 'border-primary bg-primary/10'
                : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5'
          )}
        >
          {previewUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={previewUrl}
                alt="Kapak önizleme"
                fill
                className="object-cover"
                unoptimized={previewUrl.startsWith('blob:')}
              />
            </div>
          ) : (
            <>
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Upload className="size-6" />
              </span>
              <p className="mt-4 font-semibold text-foreground">
                Sürükleyip bırakın veya tıklayın
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Önerilen: 1920×1080 px · JPG, PNG veya WebP · max. 5 MB
              </p>
            </>
          )}
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) applyFile(file);
            }}
          />
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <label htmlFor={`${inputId}-url`} className="text-sm font-medium text-foreground">
            Görsel linki
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={`${inputId}-url`}
              type="url"
              inputMode="url"
              placeholder="https://ornek.com/kapak-gorseli.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUrlApply();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={handleUrlApply} className="shrink-0">
              Önizle
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Herkese açık bir görsel URL&apos;si yapıştırın. Kayıt sırasında bu adres kullanılır.
          </p>
          {previewUrl?.startsWith('http') && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
              <Image
                src={previewUrl}
                alt="Kapak önizleme"
                fill
                className="object-cover"
                unoptimized
                onError={() => setError('Görsel yüklenemedi. Linki kontrol edin.')}
              />
            </div>
          )}
        </div>
      )}

      {previewUrl && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={clearImage}>
            <Trash2 className="mr-1.5 size-3.5" />
            Görseli kaldır
          </Button>
          {mode === 'file' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <ImageIcon className="mr-1.5 size-3.5" />
              Başka görsel seç
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
