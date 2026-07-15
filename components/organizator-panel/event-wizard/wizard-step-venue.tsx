'use client';

import { useRef, useState } from 'react';
import { Globe, ImageIcon, Loader2, MapPin, Monitor, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  WizardFormRow,
  WizardFormSection,
  WizardOptionCards,
  WizardTextarea
} from '@/components/organizator-panel/wizard-form';
import { EVENT_WIZARD_TAGS } from '@/lib/organizator/event-wizard-constants';
import { cn } from '@/lib/utils';

type LocationMode = '' | 'venue' | 'online' | 'hybrid';

interface WizardStepVenueProps {
  location: LocationMode;
  onLocationChange: (value: LocationMode) => void;
  venueName: string;
  onVenueNameChange: (value: string) => void;
  venueAddress: string;
  onVenueAddressChange: (value: string) => void;
  venueDetail: string;
  onVenueDetailChange: (value: string) => void;
  onlineUrl: string;
  onOnlineUrlChange: (value: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  venueMapUrl?: string;
  onVenueMapUrlChange: (url: string | undefined) => void;
}

export function WizardStepVenue({
  location,
  onLocationChange,
  venueName,
  onVenueNameChange,
  venueAddress,
  onVenueAddressChange,
  venueDetail,
  onVenueDetailChange,
  onlineUrl,
  onOnlineUrlChange,
  tags,
  onTagsChange,
  venueMapUrl,
  onVenueMapUrlChange
}: WizardStepVenueProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleMapUpload(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setUploadError('Sadece görsel (JPG, PNG, WebP) veya PDF yüklenebilir');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Dosya 10 MB sınırını aşıyor');
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/organizer/venue-map', { method: 'POST', body: form });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Yükleme başarısız');
      const { url } = await res.json();
      onVenueMapUrlChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  }

  function toggleTag(tag: string) {
    if (tags.includes(tag)) {
      onTagsChange(tags.filter((t) => t !== tag));
    } else {
      onTagsChange([...tags, tag]);
    }
  }

  return (
    <div className="space-y-6">
      <WizardFormSection
        title="Mekan & Konum"
        description="Etkinliğin gerçekleşeceği mekanı ve adres bilgilerini girin."
        icon={MapPin}
      >
        <WizardFormRow label="Mekan tipi" required>
          <WizardOptionCards
            value={location}
            onChange={(v) => onLocationChange(v as LocationMode)}
            options={[
              {
                id: 'venue',
                title: 'Fiziksel Mekan',
                description: 'Salon, açık hava, stadyum',
                icon: MapPin
              },
              {
                id: 'online',
                title: 'Online',
                description: 'Canlı yayın veya webinar',
                icon: Monitor
              },
              {
                id: 'hybrid',
                title: 'Hibrit',
                description: 'Hem fiziksel hem online',
                icon: Globe
              }
            ]}
          />
        </WizardFormRow>

        {location !== 'online' && (
          <>
            <WizardFormRow label="Mekan adı" required={location === 'venue'}>
              <Input
                value={venueName}
                onChange={(e) => onVenueNameChange(e.target.value)}
                placeholder="Örn: Volkswagen Arena"
                className="h-11 rounded-lg"
              />
            </WizardFormRow>
            <WizardFormRow label="Adres">
              <Input
                value={venueAddress}
                onChange={(e) => onVenueAddressChange(e.target.value)}
                placeholder="Sokak, mahalle, ilçe"
                className="h-11 rounded-lg"
              />
            </WizardFormRow>
            <WizardFormRow label="Mekan detayı" alignTop>
              <WizardTextarea
                value={venueDetail}
                onChange={(e) => onVenueDetailChange(e.target.value)}
                placeholder="Adres tarifi, otopark durumu vb."
                rows={3}
              />
            </WizardFormRow>
          </>
        )}

        {(location === 'online' || location === 'hybrid') && (
          <WizardFormRow label="Online erişim bağlantısı">
            <Input
              value={onlineUrl}
              onChange={(e) => onOnlineUrlChange(e.target.value)}
              placeholder="https://..."
              className="h-11 rounded-lg"
            />
          </WizardFormRow>
        )}
      </WizardFormSection>

      {location !== 'online' && (
        <WizardFormSection
          title="Etkinlik Haritası / Oturma Düzeni"
          description="Mekan oturma planı veya etkinlik haritasını yükleyin. Görsel veya PDF olabilir."
          icon={ImageIcon}
        >
          <div className="space-y-3">
            {venueMapUrl ? (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-xl border border-border bg-muted/20">
                  <Image
                    src={venueMapUrl}
                    alt="Etkinlik haritası"
                    width={800}
                    height={500}
                    className="w-full object-contain max-h-80"
                    unoptimized
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="mr-1.5 size-3.5" />
                    Değiştir
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { onVenueMapUrlChange(undefined); setUploadError(null); }}>
                    <Trash2 className="mr-1.5 size-3.5" />
                    Kaldır
                  </Button>
                </div>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => !uploading && fileRef.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !uploading && fileRef.current?.click()}
                className={cn(
                  'flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-all',
                  uploading
                    ? 'border-primary/40 bg-primary/5 cursor-not-allowed'
                    : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-primary/5'
                )}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                  </>
                ) : (
                  <>
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <MapPin className="size-6" />
                    </span>
                    <div className="text-center">
                      <p className="font-semibold text-foreground">Harita yükle</p>
                      <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP veya PDF · max. 10 MB</p>
                    </div>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleMapUpload(f);
                e.target.value = '';
              }}
            />
            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          </div>
        </WizardFormSection>
      )}

      <WizardFormSection
        title="Etiket Seçiniz"
        description="Etkinliğinizi keşfedilebilir kılmak için bir veya daha fazla etiket seçin."
        icon={MapPin}
      >
        <div className="flex flex-wrap gap-2 py-2">
          {EVENT_WIZARD_TAGS.map((tag) => {
            const selected = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </WizardFormSection>
    </div>
  );
}
