'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  Globe,
  MapPin,
  Search,
  Tag
} from 'lucide-react';
import { useCity } from '@/components/providers/city-provider';
import { useTranslations } from '@/components/providers';
import { SUPPORTED_CITIES } from '@/lib/location/cities';
import { cn } from '@/lib/utils';

type CategoryOption = {
  slug: string;
  name: string;
};

type DatePreset = 'any' | 'today' | 'tomorrow' | 'weekend';

function formatDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function resolveDateParams(preset: DatePreset): { tarih?: string; donem?: string } {
  const now = new Date();
  if (preset === 'any') return {};
  if (preset === 'today') return { tarih: formatDateInput(now) };
  if (preset === 'tomorrow') {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    return { tarih: formatDateInput(t) };
  }
  if (preset === 'weekend') return { donem: 'weekend' };
  return {};
}

type HomeEventSearchBarProps = {
  categories: CategoryOption[];
  className?: string;
};

function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground',
        className
      )}
    >
      {children}
    </span>
  );
}

function SelectChevron({ className }: { className?: string }) {
  return (
    <ChevronDown
      className={cn(
        'pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground lg:right-3 lg:size-4',
        className
      )}
      aria-hidden
    />
  );
}

export function HomeEventSearchBar({
  categories,
  className
}: HomeEventSearchBarProps) {
  const t = useTranslations();
  const router = useRouter();
  const { citySlug, cityName, setCity } = useCity();

  const dateLabels = useMemo(
    () =>
      ({
        any: t.filters.allDates,
        today: t.common.today,
        tomorrow: t.common.tomorrow,
        weekend: t.home.popularThisWeek
      }) satisfies Record<DatePreset, string>,
    [t]
  );

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('any');
  const [onlineOnly, setOnlineOnly] = useState(false);

  function handleCityChange(nextSlug: string) {
    if (!nextSlug) return;
    setCity(nextSlug, { refreshOnly: true });
  }

  const displayCityName = useMemo(
    () => cityName || t.filters.allCities,
    [cityName, t.filters.allCities]
  );

  const categoryLabel = useMemo(() => {
    if (!category) return t.nav.categories;
    return categories.find((c) => c.slug === category)?.name ?? t.nav.categories;
  }, [category, categories, t.nav.categories]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('kategori', category);
    if (citySlug) params.set('sehir', citySlug);
    const dateParams = resolveDateParams(datePreset);
    if (dateParams.tarih) params.set('tarih', dateParams.tarih);
    if (dateParams.donem) params.set('donem', dateParams.donem);
    if (onlineOnly) params.set('online', '1');
    const qs = params.toString();
    router.push(qs ? `/etkinlikler?${qs}` : '/etkinlikler');
  }

  const fieldClassDesktop =
    'h-11 w-full appearance-none rounded-lg border-0 bg-transparent pl-9 pr-8 text-base font-semibold text-foreground outline-none sm:text-sm';

  const fieldClassMobile =
    'h-9 w-full appearance-none truncate rounded-lg border border-border/60 bg-muted/30 pl-8 pr-7 text-xs font-semibold text-foreground outline-none';

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-lg)]',
        className
      )}
    >
      {/* —— Mobil: kompakt 2 satır —— */}
      <div className="space-y-2 p-2.5 lg:hidden">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.home.heroSearchPlaceholder}
              className="h-10 w-full rounded-xl border border-border/60 bg-muted/30 pl-9 pr-3 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="btn-gradient-primary h-10 shrink-0 rounded-xl px-4 text-sm font-bold text-primary-foreground shadow-sm"
          >
            {t.common.search}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative min-w-0">
            <Tag
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--bf-accent-ink)]"
              aria-hidden
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={fieldClassMobile}
              aria-label={t.filters.selectCategory}
            >
              <option value="">{t.nav.categories}</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>

          <div className="relative min-w-0">
            <MapPin
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--bf-accent-ink)]"
              aria-hidden
            />
            <select
              value={citySlug}
              onChange={(e) => handleCityChange(e.target.value)}
              className={fieldClassMobile}
              aria-label={t.filters.selectCity}
            >
              <option value="">{t.nav.cities}</option>
              {SUPPORTED_CITIES.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.name}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>

          <div className="relative min-w-0">
            <CalendarDays
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--bf-accent-ink)]"
              aria-hidden
            />
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              className={fieldClassMobile}
              aria-label={t.filters.pickDate}
            >
              {(Object.keys(dateLabels) as DatePreset[]).map((key) => (
                <option key={key} value={key}>
                  {dateLabels[key]}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>

          <label
            className={cn(
              'flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors',
              onlineOnly
                ? 'border-primary/40 bg-primary/10 text-[var(--bf-accent-ink)]'
                : 'border-border/60 bg-muted/30 text-foreground'
            )}
          >
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => setOnlineOnly(e.target.checked)}
              className="sr-only"
            />
            <Globe className="size-3.5 shrink-0" aria-hidden />
            {t.categories.online}
          </label>
        </div>

        <p className="truncate px-0.5 text-center text-[11px] text-muted-foreground">
          {displayCityName !== t.filters.allCities ? (
            <span className="font-semibold text-foreground">{displayCityName}</span>
          ) : (
            t.filters.allCities
          )}
          {' · '}
          {categoryLabel}
          {' · '}
          {dateLabels[datePreset]}
        </p>
      </div>

      {/* —— Masaüstü: mevcut yatay şerit —— */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.9fr)_auto_auto] lg:divide-x lg:divide-y-0 lg:divide-border/70">
        <div className="relative px-3 py-3">
          <FieldLabel>{t.common.search}</FieldLabel>
          <Search
            className="pointer-events-none absolute left-3 top-[calc(50%+6px)] size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.home.heroSearchPlaceholder}
            className={fieldClassDesktop}
            autoComplete="off"
          />
        </div>

        <div className="relative px-3 py-3">
          <FieldLabel>{t.nav.categories}</FieldLabel>
          <Tag
            className="pointer-events-none absolute left-3 top-[calc(50%+6px)] size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={fieldClassDesktop}
            aria-label={t.filters.selectCategory}
          >
            <option value="">{t.common.all}</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>

        <div className="relative px-3 py-3">
          <FieldLabel>{t.nav.cities}</FieldLabel>
          <MapPin
            className="pointer-events-none absolute left-3 top-[calc(50%+6px)] size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <select
            value={citySlug}
            onChange={(e) => handleCityChange(e.target.value)}
            className={fieldClassDesktop}
            aria-label={t.filters.selectCity}
          >
            <option value="">{t.filters.allCities}</option>
            {SUPPORTED_CITIES.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>

        <div className="relative px-3 py-3">
          <FieldLabel>{t.events.date}</FieldLabel>
          <CalendarDays
            className="pointer-events-none absolute left-3 top-[calc(50%+6px)] size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DatePreset)}
            className={fieldClassDesktop}
            aria-label={t.filters.pickDate}
          >
            {(Object.keys(dateLabels) as DatePreset[]).map((key) => (
              <option key={key} value={key}>
                {dateLabels[key]}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>

        <label className="flex min-w-[7rem] cursor-pointer flex-col items-center justify-center gap-1 px-3 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/40">
          <input
            type="checkbox"
            checked={onlineOnly}
            onChange={(e) => setOnlineOnly(e.target.checked)}
            className="size-4 rounded border-border text-[var(--bf-accent-ink)] focus:ring-primary"
          />
          <span className="flex flex-col items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
            <Globe className="size-4 shrink-0 text-[var(--bf-accent-ink)]" aria-hidden />
            {t.categories.online}
          </span>
        </label>

        <div className="flex items-stretch">
          <button
            type="submit"
            className="btn-gradient-primary flex min-w-[5.5rem] items-center justify-center px-8 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-[var(--shadow-sm)] transition hover:-translate-y-px hover:shadow-[var(--shadow-md)]"
          >
            {t.common.search}
          </button>
        </div>
      </div>

      <p className="hidden border-t border-border/60 bg-muted/30 px-4 py-2 text-xs text-muted-foreground lg:block">
        {displayCityName !== t.filters.allCities ? (
          <>
            {t.filters.selectCity}:{' '}
            <span className="font-semibold text-foreground">{displayCityName}</span>
            {' · '}
          </>
        ) : null}
        {t.home.heroSubtitle}
      </p>
    </form>
  );
}
