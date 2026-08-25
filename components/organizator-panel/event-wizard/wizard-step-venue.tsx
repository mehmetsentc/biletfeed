'use client';

import { useEffect, useRef, useState } from 'react';
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
import { VenuePlacesAutocomplete } from '@/components/organizator-panel/venue-places-autocomplete';
import { EVENT_WIZARD_TAGS } from '@/lib/organizator/event-wizard-constants';
import type { CitySlug } from '@/lib/location/cities';
import { cn } from '@/lib/utils';

type LocationMode = '' | 'venue' | 'online' | 'hybrid';

type SavedVenue = {
  id: string;
  name: string;
  address: string;
  city?: { name: string; slug: string } | null;
  seatPlan?: { layout?: string; zones?: unknown[]; mapImageUrl?: string } | null;
};

function hasSeatPlan(plan: SavedVenue['seatPlan']): boolean {
  if (!plan || typeof plan !== 'object') return false;
  if (Array.isArray(plan.zones) && plan.zones.length > 0) return true;
  if (plan.layout === 'general' || plan.layout === 'sections' || plan.layout === 'tables') {
    return true;
  }
  return Boolean(plan.mapImageUrl);
}

interface WizardStepVenueProps {
  location: LocationMode;
  onLocationChange: (value: LocationMode) => void;
  venueId?: string;
  onVenueIdChange: (id: string | undefined) => void;
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
  cityHint?: string;
  onCitySlugChange?: (slug: CitySlug) => void;
}

export function WizardStepVenue({
  location,
  onLocationChange,
  venueId,
  onVenueIdChange,
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
  onVenueMapUrlChange,
  cityHint,
  onCitySlugChange
}: WizardStepVenueProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedVenues, setSavedVenues] = useState<SavedVenue[]>([]);

  useEffect(() => {
    void fetch('/api/organizer/venues', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { venues?: SavedVenue[] } | null) => {
        setSavedVenues(data?.venues ?? []);
      })
      .catch(() => setSavedVenues([]));
  }, []);

  const venuesWithPlan = savedVenues.filter((v) => hasSeatPlan(v.seatPlan));

  async function handleMapUpload(file: File) {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf'
    ];
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
      const { url } = (await res.json()) as { url: string };
      onVenueMapUrlChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Yükleme başarısız');
    } finally {
      setUploading(false);
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

        {location !== 'online' && venuesWithPlan.length > 0 && (
          <WizardFormRow label="Kayıtlı oturma planı" alignTop>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Daha önce kaydedilmiş mekan planını seçin — her güncellemede yeniden
                oluşturmanıza gerek kalmaz.
              </p>
              <div className="flex flex-wrap gap-2">
                {venuesWithPlan.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      onVenueIdChange(v.id);
                      onVenueNameChange(v.name);
                      onVenueAddressChange(v.address);
                      const mapUrl = v.seatPlan?.mapImageUrl;
                      if (typeof mapUrl === 'string' && mapUrl) {
                        onVenueMapUrlChange(mapUrl);
                      }
                      if (v.city?.slug && onCitySlugChange) {
                        onCitySlugChange(v.city.slug as CitySlug);
                      }
                    }}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                      venueId === v.id
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <span className="font-medium">{v.name}</span>
                    {v.city?.name ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {v.city.name}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </WizardFormRow>
        )}

        {location !== 'online' && (
          <>
            <WizardFormRow label="Mekan adı" required={location === 'venue'}>
              <VenuePlacesAutocomplete
                value={venueName}
                onChange={onVenueNameChange}
                cityHint={cityHint}
                onPlaceSelect={(place) => {
                  onVenueNameChange(place.name);
                  onVenueIdChange(undefined);
                  if (place.address) onVenueAddressChange(place.address);
                  if (place.citySlug && onCitySlugChange) {
                    onCitySlugChange(place.citySlug);
                  }
                }}
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
                    className="max-h-80 w-full object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="mr-1.5 size-3.5" />
                    Değiştir
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onVenueMapUrlChange(undefined)}
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    Kaldır
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-sm text-muted-foreground transition-colors hover:bg-muted/40"
              >
                {uploading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <Upload className="size-6" />
                )}
                {uploading ? 'Yükleniyor…' : 'Harita / oturma planı yükle'}
              </button>
            )}
            {uploadError ? (
              <p className="text-sm text-destructive">{uploadError}</p>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleMapUpload(file);
                e.target.value = '';
              }}
            />
          </div>
        </WizardFormSection>
      )}

      <WizardFormSection title="Etiketler" description="Keşif ve filtreleme için etiket ekleyin.">
        <div className="flex flex-wrap gap-2">
          {EVENT_WIZARD_TAGS.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  onTagsChange(
                    active ? tags.filter((t) => t !== tag) : [...tags, tag].slice(0, 20)
                  )
                }
                className={cn(
                  'rounded-full border px-3 py-1 text-xs',
                  active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground'
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
