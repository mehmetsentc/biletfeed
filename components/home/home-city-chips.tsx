'use client';

import { Loader2 } from 'lucide-react';
import { useCity } from '@/components/providers/city-provider';
import { cn } from '@/lib/utils';

export function HomeCityChips() {
  const { citySlug, cities, setCity, detectingLocation, hasChosenCity } =
    useCity();
  const activeCities = cities.filter((city) => (city.count ?? 0) > 0);

  if (activeCities.length === 0 && !detectingLocation) return null;

  return (
    <section className="border-b border-border bg-background md:bg-background" style={{ background: 'var(--mobile-chip-bg, inherit)' }}>
      <div
        className="md:hidden"
        style={{ background: '#13161c', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex gap-2 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {detectingLocation && !hasChosenCity ? (
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Loader2 className="size-4 animate-spin text-primary" />
              Tespit ediliyor…
            </div>
          ) : (
            activeCities.map((city) => {
              const active = city.slug === citySlug;
              return (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => setCity(city.slug, { refreshOnly: true })}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'border-primary bg-primary text-black'
                      : 'border-white/10 bg-white/5 text-white/60'
                  )}
                >
                  {city.name}
                  {city.count != null && city.count > 0 && (
                    <span className={cn('text-[9px] font-bold', active ? 'text-black/70' : 'text-white/35')}>
                      {city.count}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="hidden shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
              Şehirler
            </span>
            {detectingLocation && !hasChosenCity ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-primary" />
                Konumunuz tespit ediliyor…
              </div>
            ) : (
              <div className="flex flex-1 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeCities.map((city) => {
                  const active = city.slug === citySlug;
                  return (
                    <button
                      key={city.slug}
                      type="button"
                      onClick={() => setCity(city.slug, { refreshOnly: true })}
                      className={cn(
                        'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50'
                      )}
                    >
                      {city.name}
                      {city.count != null && city.count > 0 && (
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
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
      </div>
    </section>
  );
}
