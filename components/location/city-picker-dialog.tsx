'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Navigation, Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { sortCitiesForPicker } from '@/lib/location/cities';
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

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase('tr');
}

export function CityPickerDialog({
  open,
  cities,
  selectedSlug,
  onSelect,
  required = false,
  onOpenChange
}: CityPickerDialogProps) {
  const [query, setQuery] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectMessage, setDetectMessage] = useState<string | null>(null);

  const eventCities = useMemo(() => {
    const withEvents = cities.filter((city) => (city.count ?? 0) > 0);
    return withEvents.length > 0 ? withEvents : cities;
  }, [cities]);

  const filteredCities = useMemo(() => {
    const sorted = sortCitiesForPicker(eventCities);
    const q = normalizeSearch(query);
    if (!q) return sorted;
    return sorted.filter((city) =>
      normalizeSearch(city.name).includes(q)
    );
  }, [eventCities, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setDetectMessage(null);
    }
  }, [open]);

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
        setDetectMessage(
          detected.source === 'geocode'
            ? `${detected.name} konumunuz olarak algılandı.`
            : `Size en yakın şehir ${detected.name} olarak seçildi.`
        );
        onSelect(detected.slug);
      })
      .finally(() => {
        if (!cancelled) setDetecting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, required, onSelect]);

  function handleOpenChange(next: boolean) {
    if (required && !next) return;
    onOpenChange?.(next);
  }

  function handleSelect(slug: string) {
    onSelect(slug);
    if (!required) {
      onOpenChange?.(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex max-h-[min(85vh,640px)] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0',
          'sm:max-w-md md:max-w-lg'
        )}
        onInteractOutside={(e) => required && e.preventDefault()}
        onEscapeKeyDown={(e) => required && e.preventDefault()}
      >
        <div className="relative border-b border-border px-5 pb-4 pt-5 text-center sm:px-6">
          {!required && (
            <button
              type="button"
              onClick={() => onOpenChange?.(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Kapat"
            >
              <X className="size-4" />
            </button>
          )}
          <DialogTitle className="text-lg font-bold sm:text-xl">
            Şehrinizi seçin
          </DialogTitle>
        </div>

        <div className="px-5 pt-4 sm:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Şehir Ara"
              className="h-11 rounded-xl border-border bg-muted/40 pl-10 text-base focus-visible:border-primary focus-visible:ring-primary/25"
              autoComplete="off"
            />
          </div>

          {(detecting || detectMessage) && (
            <div
              className={cn(
                'mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm',
                detecting
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-muted/40 text-muted-foreground'
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
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-4 sm:px-3">
          {filteredCities.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Etkinlik bulunan şehir eşleşmedi.
            </p>
          ) : (
            <ul className="divide-y divide-border/80">
              {filteredCities.map((city) => {
                const active = selectedSlug === city.slug;
                return (
                  <li key={city.slug}>
                    <button
                      type="button"
                      onClick={() => handleSelect(city.slug)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3.5 text-left transition-colors sm:py-4',
                        active
                          ? 'bg-primary/10 text-foreground'
                          : 'hover:bg-muted/60'
                      )}
                    >
                      <span className="min-w-0">
                        <span className="font-bold text-foreground">{city.name}</span>
                        <span className="text-muted-foreground">, Türkiye</span>
                      </span>
                      {city.count != null && city.count > 0 ? (
                        <span className="shrink-0 text-xs font-medium text-primary">
                          {city.count}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
