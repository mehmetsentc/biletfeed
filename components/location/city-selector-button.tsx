'use client';

import { MapPin } from 'lucide-react';
import { useCityOptional } from '@/components/providers/city-provider';
import { cn } from '@/lib/utils';

interface CitySelectorButtonProps {
  className?: string;
}

export function CitySelectorButton({ className }: CitySelectorButtonProps) {
  const city = useCityOptional();
  if (!city) return null;

  return (
    <button
      type="button"
      onClick={city.openCityPicker}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-[var(--header-border)] px-2.5 py-1 text-xs font-semibold text-[var(--header-fg)] transition-colors hover:border-primary/50 hover:bg-[var(--header-hover)]',
        className
      )}
      aria-label="Şehir değiştir"
    >
      <MapPin className="size-3.5 text-primary" />
      {city.cityName}
    </button>
  );
}
