'use client';

import { Loader2, MapPin } from 'lucide-react';
import { useCity } from '@/components/providers/city-provider';
import { useTranslations } from '@/components/providers';
import { cn } from '@/lib/utils';

export function HomeCityChips() {
  const t = useTranslations();
  const {
    citySlug,
    cities,
    setCity,
    openCityPicker,
    detectingLocation,
    hasChosenCity
  } = useCity();
  const activeCities = cities
    .filter((city) => (city.count ?? 0) > 0)
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

  if (activeCities.length === 0 && !detectingLocation) return null;

  return (
    <section className="border-b border-border/80 bg-background">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center gap-2.5 md:gap-3">
          <button
            type="button"
            onClick={openCityPicker}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10',
              'px-3 py-2 text-xs font-semibold text-[var(--bf-accent-ink)] transition-colors',
              'hover:border-primary/60 hover:bg-primary/15',
              'md:px-3.5 md:py-2.5 md:text-sm'
            )}
            aria-label={t.filters.changeCity}
          >
            <MapPin className="size-3.5 shrink-0 md:size-4" />
            <span className="hidden sm:inline">{t.nav.cities}</span>
          </button>

          {detectingLocation && !hasChosenCity ? (
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-[var(--bf-accent-ink)]" />
              {t.location.detecting}
            </div>
          ) : (
            <div className="flex flex-1 gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-2.5">
              {activeCities.map((city) => {
                const active = city.slug === citySlug;
                return (
                  <button
                    key={city.slug}
                    type="button"
                    onClick={() => setCity(city.slug, { refreshOnly: true })}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-2 rounded-full border font-semibold transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]',
                      'px-3.5 py-2 text-sm md:px-4 md:py-2.5',
                      active
                        ? '-translate-y-0.5 border-primary bg-primary text-primary-foreground shadow-[var(--shadow-md)]'
                        : 'border-border/80 bg-card text-foreground shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[var(--shadow-sm)]'
                    )}
                  >
                    {city.name}
                    {city.count != null && city.count > 0 && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums',
                          active
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {city.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
