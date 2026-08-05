'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  IMAGE_SPECS,
  formatImageSpecHint,
  type EventMediaAssets
} from '@/lib/config/image-dimensions';
import { Upload } from 'lucide-react';

const FIELDS: Array<{
  key: keyof EventMediaAssets;
  specKey: keyof typeof IMAGE_SPECS;
}> = [
  { key: 'sponsorBandUrl', specKey: 'sponsorBand' },
  { key: 'popup', specKey: 'marketingPopup' },
  { key: 'igPost', specKey: 'marketingIgPost' },
  { key: 'igStory', specKey: 'marketingIgStory' },
  { key: 'metaAd', specKey: 'marketingMetaAd' },
  { key: 'push', specKey: 'marketingPush' },
  { key: 'email', specKey: 'marketingEmail' }
];

type MarketingAssetsFormProps = {
  value: EventMediaAssets;
  onChange: (next: EventMediaAssets) => void;
};

export function MarketingAssetsForm({
  value,
  onChange
}: MarketingAssetsFormProps) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadFor(key: keyof EventMediaAssets, file: File) {
    setUploadingKey(key);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/organizer/upload-image', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin'
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || 'Yükleme başarısız');
        return;
      }
      onChange({ ...value, [key]: data.url });
    } catch {
      setError('Yükleme başarısız');
    } finally {
      setUploadingKey(null);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Dijital pazarlama görselleri (otomatik yayınlanmaz; ajans / kampanya için
        saklanır). Ölçülere uyun.
      </p>
      {FIELDS.map(({ key, specKey }) => {
        const spec = IMAGE_SPECS[specKey];
        return (
          <div key={key} className="space-y-1.5">
            <Label className="text-sm font-semibold">{spec.label}</Label>
            <p className="text-xs text-muted-foreground">
              {formatImageSpecHint(spec)}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={value[key] ?? ''}
                onChange={(e) =>
                  onChange({ ...value, [key]: e.target.value.trim() || undefined })
                }
                placeholder="https://…"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={uploadingKey === key}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/jpeg,image/png,image/webp';
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (file) void uploadFor(key, file);
                  };
                  input.click();
                }}
              >
                <Upload className="size-3.5" />
                {uploadingKey === key ? '…' : 'Yükle'}
              </Button>
            </div>
          </div>
        );
      })}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
