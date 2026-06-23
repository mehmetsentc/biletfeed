'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCityBySlug } from '@/lib/location/cities';
import { detectCityFromGeolocation } from '@/lib/location/detect-city';

export type CityOption = {
  slug: string;
  name: string;
  count?: number;
};

interface CityPickerDialogProps {
  open: boolean;
  cities: CityOption[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  /** İlk ziyaret — kapatma ve dış tıklama engellenir */
  required?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CityPickerDialog({
  open,
  cities,
  selectedSlug,
  onSelect,
  required = false,
  onOpenChange
}: CityPickerDialogProps) {
  const [pendingSlug, setPendingSlug] = useState(selectedSlug);
  const [detecting, setDetecting] = useState(false);
  const [detectMessage, setDetectMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) setPendingSlug(selectedSlug);
  }, [open, selectedSlug]);

  useEffect(() => {
    if (!open || !required) return;

    let cancelled = false;
    setDetecting(true);
    setDetectMessage('Konumunuz tespit ediliyor…');

    detectCityFromGeolocation()
      .then((detected) => {
        if (cancelled || !detected) {
          if (!cancelled) setDetectMessage(null);
          return;
        }
        setPendingSlug(detected.slug);
        setDetectMessage(
          detected.source === 'geocode'
            ? `${detected.name} konumunuz olarak algılandı.`
            : `Size en yakın şehir ${detected.name} olarak seçildi.`
        );
        if (required) {
          onSelect(detected.slug);
        }
      })
      .finally(() => {
        if (!cancelled) setDetecting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, required, onSelect]);

  function handleConfirm() {
    onSelect(pendingSlug);
  }

  function handleOpenChange(next: boolean) {
    if (required && !next) return;
    onOpenChange?.(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-5 sm:max-w-md"
        onInteractOutside={(e) => required && e.preventDefault()}
        onEscapeKeyDown={(e) => required && e.preventDefault()}
        showCloseButton={!required}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="size-5 text-primary" />
            Şehrinizi seçin
          </DialogTitle>
          <DialogDescription>
            Yakınınızdaki etkinlikleri gösterebilmemiz için konumunuza izin
            verin veya bir şehir seçin.
          </DialogDescription>
        </DialogHeader>

        {(detecting || detectMessage) && (
          <div
            className={cn(
              'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm',
              detecting
                ? 'border-primary/30 bg-primary/5 text-foreground'
                : 'border-border bg-muted/50 text-muted-foreground'
            )}
          >
            {detecting ? (
              <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />
            ) : (
              <Navigation className="mt-0.5 size-4 shrink-0 text-primary" />
            )}
            <span>{detecting ? 'Konumunuz tespit ediliyor…' : detectMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {cities.map((city) => {
            const active = pendingSlug === city.slug;
            return (
              <button
                key={city.slug}
                type="button"
                onClick={() => {
                  setPendingSlug(city.slug);
                  setDetectMessage(null);
                }}
                className={cn(
                  'rounded-xl border px-3 py-3 text-left transition-colors',
                  active
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50'
                )}
              >
                <span className="block font-semibold">{city.name}</span>
                {city.count != null && city.count > 0 && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {city.count} etkinlik
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full font-semibold"
          onClick={handleConfirm}
          disabled={detecting}
        >
          {getCityBySlug(pendingSlug).name}&apos;da etkinlikleri göster
        </Button>
      </DialogContent>
    </Dialog>
  );
}
