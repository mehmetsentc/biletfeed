'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  Globe,
  MapPin,
  Search,
  Tag
} from 'lucide-react';
import { useCityOptional } from '@/components/providers/city-provider';
import { SUPPORTED_CITIES } from '@/lib/location/cities';
import { cn } from '@/lib/utils';

type CategoryOption = {
  slug: string;
  name: string;
};

type DatePreset = 'any' | 'today' | 'tomorrow' | 'weekend';

const DATE_LABELS: Record<DatePreset, string> = {
  any: 'Herhangi Zaman',
  today: 'Bugün',
  tomorrow: 'Yarın',
  weekend: 'Bu Hafta Sonu'
};

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

function SelectChevron() {
  return (
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden
    />
  );
}

export function HomeEventSearchBar({
  categories,
  className
}: HomeEventSearchBarProps) {
  const router = useRouter();
  const cityCtx = useCityOptional();
  const defaultCitySlug = cityCtx?.citySlug ?? 'istanbul';

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [citySlug, setCitySlug] = useState(defaultCitySlug);
  const [datePreset, setDatePreset] = useState<DatePreset>('any');
  const [onlineOnly, setOnlineOnly] = useState(false);

  useEffect(() => {
    if (cityCtx?.citySlug) {
      setCitySlug(cityCtx.citySlug);
    }
  }, [cityCtx?.citySlug]);

  const cityName = useMemo(() => {
    if (!citySlug) return 'Herhangi Yer';
    return SUPPORTED_CITIES.find((c) => c.slug === citySlug)?.name ?? 'Herhangi Yer';
  }, [citySlug]);

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

  const fieldClass =
    'h-11 w-full appearance-none rounded-lg border-0 bg-transparent pl-9 pr-8 text-base font-semibold text-foreground outline-none sm:text-sm';

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-lg)]',
        className
      )}
    >
      <div className="grid grid-cols-1 divide-y divide-border/70 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.9fr)_auto_auto] lg:divide-x lg:divide-y-0">
        {/* Arama */}
        <div className="relative px-3 py-2.5 lg:py-3">
          <FieldLabel>Arama</FieldLabel>
          <Search
            className="pointer-events-none absolute left-3 top-[calc(50%+6px)] size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Etkinlik, mekân, sanatçı…"
            className={fieldClass}
            autoComplete="off"
          />
        </div>

        {/* Kategori */}
        <div className="relative px-3 py-2.5 lg:py-3">
          <FieldLabel>Kategori</FieldLabel>
          <Tag
            className="pointer-events-none absolute left-3 top-[calc(50%+6px)] size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={fieldClass}
            aria-label="Kategori seç"
          >
            <option value="">Herhangi Kategori</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>

        {/* Konum */}
        <div className="relative px-3 py-2.5 lg:py-3">
          <FieldLabel>Konum</FieldLabel>
          <MapPin
            className="pointer-events-none absolute left-3 top-[calc(50%+6px)] size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <select
            value={citySlug}
            onChange={(e) => setCitySlug(e.target.value)}
            className={fieldClass}
            aria-label="Şehir seç"
          >
            <option value="">Herhangi Yer</option>
            {SUPPORTED_CITIES.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>

        {/* Tarih */}
        <div className="relative px-3 py-2.5 lg:py-3">
          <FieldLabel>Tarih</FieldLabel>
          <CalendarDays
            className="pointer-events-none absolute left-3 top-[calc(50%+6px)] size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DatePreset)}
            className={fieldClass}
            aria-label="Tarih seç"
          >
            {(Object.keys(DATE_LABELS) as DatePreset[]).map((key) => (
              <option key={key} value={key}>
                {DATE_LABELS[key]}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>

        {/* Online */}
        <label className="flex cursor-pointer items-center justify-center gap-2 px-3 py-3 text-sm font-semibold text-foreground transition hover:bg-muted/40 lg:min-w-[7rem] lg:flex-col lg:gap-1 lg:py-3">
          <input
            type="checkbox"
            checked={onlineOnly}
            onChange={(e) => setOnlineOnly(e.target.checked)}
            className="size-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide lg:flex-col">
            <Globe className="size-4 shrink-0 text-primary" aria-hidden />
            Online
          </span>
        </label>

        {/* Ara butonu */}
        <div className="flex items-stretch p-2 lg:p-0">
          <button
            type="submit"
            className="btn-gradient-primary flex w-full min-w-[5.5rem] items-center justify-center rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-[var(--shadow-sm)] transition hover:-translate-y-px hover:shadow-[var(--shadow-md)] lg:rounded-none lg:px-8"
          >
            Ara
          </button>
        </div>
      </div>

      <p className="border-t border-border/60 bg-muted/30 px-4 py-2 text-center text-xs text-muted-foreground md:text-left">
        {cityName !== 'Herhangi Yer' ? (
          <>
            Seçili şehir: <span className="font-semibold text-foreground">{cityName}</span>
            {' · '}
          </>
        ) : null}
        Konser, festival, tiyatro ve daha fazlasını keşfedin
      </p>
    </form>
  );
}
