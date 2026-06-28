'use client';

import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { useCityOptional } from '@/components/providers/city-provider';
import { resolveCitySlug } from '@/lib/scraper/normalize';
import { cn } from '@/lib/utils';

interface HeroSearchProps {
  variant?: 'default' | 'figma';
  className?: string;
}

/** Açık arama kutusu — koyu temadan bağımsız sabit renkler */
const lightFieldClass =
  'h-14 w-full border-0 bg-transparent pl-12 pr-4 text-base font-normal text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground';

export function HeroSearch({ variant = 'default', className }: HeroSearchProps) {
  const router = useRouter();
  const city = useCityOptional();
  const defaultCityName = city?.cityName ?? 'İstanbul';
  const isFigma = variant === 'figma';

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const q = form.get('q') as string;
    const cityInput = form.get('city') as string;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const { slug } = resolveCitySlug(cityInput?.trim() || defaultCityName);
    params.set('sehir', slug);
    router.push(`/etkinlikler?${params.toString()}`);
  }

  if (isFigma) {
    return (
      <form
        onSubmit={handleSearch}
        className={cn(
          'mx-auto flex max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-2xl shadow-black/25 sm:flex-row sm:items-stretch',
          '[color-scheme:light]',
          className
        )}
      >
        <div className="relative flex flex-1 items-center">
          <Search
            className="pointer-events-none absolute left-4 size-5 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            autoComplete="off"
            placeholder="Etkinlik, kategori, konum ara..."
            className={lightFieldClass}
          />
        </div>

        <div className="h-px shrink-0 bg-border sm:hidden" />
        <div className="hidden w-px shrink-0 self-stretch bg-border sm:block" />

        <button
          type="button"
          onClick={() => city?.openCityPicker()}
          className="relative flex w-full shrink-0 items-center transition-colors hover:bg-muted sm:w-48"
        >
          <MapPin
            className="pointer-events-none absolute left-4 size-4 text-muted-foreground"
            aria-hidden
          />
          <span className="flex h-14 w-full items-center pl-10 pr-10 text-left text-base font-semibold text-foreground">
            {defaultCityName}
          </span>
          <ChevronDown
            className="pointer-events-none absolute right-4 size-4 text-muted-foreground"
            aria-hidden
          />
          <input type="hidden" name="city" value={defaultCityName} />
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSearch}
      className={cn(
        'mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-border bg-card p-3 text-foreground shadow-2xl shadow-black/20 [color-scheme:light] sm:flex-row sm:items-center sm:rounded-full sm:p-2',
        className
      )}
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          placeholder="Etkinlik, sanatçı veya mekan ara..."
          className="h-12 w-full border-0 bg-transparent pl-12 pr-3 text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="hidden h-8 w-px shrink-0 bg-border sm:block" />
      <button
        type="button"
        onClick={() => city?.openCityPicker()}
        className="relative flex items-center sm:w-40"
      >
        <MapPin
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <span className="flex h-12 w-full items-center pl-10 pr-8 text-base font-semibold text-foreground">
          {defaultCityName}
        </span>
        <input type="hidden" name="city" value={defaultCityName} />
      </button>
      <button
        type="submit"
        className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground sm:rounded-full"
      >
        Ara
      </button>
    </form>
  );
}
