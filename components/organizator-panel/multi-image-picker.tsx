'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  formatImageSpecHint,
  type ImageSizeSpec
} from '@/lib/config/image-dimensions';

const MAX_BYTES = 5 * 1024 * 1024;

type MultiImagePickerProps = {
  urls: string[];
  onChange: (urls: string[]) => void;
  maxCount: number;
  spec: ImageSizeSpec;
  className?: string;
  /** Dosya yükleme — /api/organizer/upload-image */
  uploadPath?: string;
};

export function MultiImagePicker({
  urls,
  onChange,
  maxCount,
  spec,
  className,
  uploadPath = '/api/organizer/upload-image'
}: MultiImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const canAdd = urls.length < maxCount;

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Sadece görsel dosyaları yüklenebilir.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Dosya 5 MB sınırını aşıyor.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(uploadPath, {
        method: 'POST',
        body: fd,
        credentials: 'same-origin'
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || 'Yükleme başarısız');
        return;
      }
      onChange([...urls, data.url].slice(0, maxCount));
    } catch {
      setError('Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  }

  function addUrl() {
    const trimmed = urlDraft.trim();
    if (!trimmed.startsWith('http')) {
      setError('Geçerli bir http(s) URL girin.');
      return;
    }
    if (urls.includes(trimmed)) {
      setError('Bu görsel zaten ekli.');
      return;
    }
    setError(null);
    onChange([...urls, trimmed].slice(0, maxCount));
    setUrlDraft('');
  }

  function removeAt(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-xs text-muted-foreground">{formatImageSpecHint(spec)}</p>

      {urls.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {urls.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="group relative aspect-video overflow-hidden rounded-xl border bg-muted"
            >
              <Image src={src} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-90 hover:bg-black"
                aria-label="Kaldır"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://… görsel URL"
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={addUrl} className="gap-1">
            <Plus className="size-4" />
            URL ekle
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            className="gap-1"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            {uploading ? 'Yükleniyor…' : 'Dosya'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        {urls.length}/{maxCount} görsel
      </p>
    </div>
  );
}
