'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { categories as mockCategories } from '@/lib/data/mock-events';
import { cn } from '@/lib/utils';
import { toggleFilterItem } from '@/components/events/events-filter-utils';
import type {
  DateFilter,
  EventsFilters,
  FormatFilter,
  PriceFilter
} from '@/components/events/events-filter-types';
import { defaultEventsFilters } from '@/components/events/events-filter-types';

const priceOptions: { id: PriceFilter; label: string }[] = [
  { id: 'free', label: 'Ücretsiz' },
  { id: 'paid', label: 'Ücretli' }
];

const dateOptions: { id: DateFilter; label: string }[] = [
  { id: 'today', label: 'Bugün' },
  { id: 'tomorrow', label: 'Yarın' },
  { id: 'week', label: 'Bu Hafta' },
  { id: 'weekend', label: 'Bu Hafta Sonu' },
  { id: 'pick', label: 'Tarih Seç' }
];

const formatOptions: { id: FormatFilter; label: string }[] = [
  { id: 'concert', label: 'Konser' },
  { id: 'festival', label: 'Festival' },
  { id: 'theatre', label: 'Tiyatro' },
  { id: 'sports', label: 'Spor' },
  { id: 'workshop', label: 'Atölye' },
  { id: 'online', label: 'Online' }
];

type FilterTheme = 'default' | 'dark';
type FilterLayout = 'list' | 'pills' | 'grid' | 'sheet';

function useThemeClasses(theme: FilterTheme) {
  const isDark = theme === 'dark';
  return {
    sectionBorder: isDark ? 'border-white/10' : 'border-border',
    title: isDark ? 'text-white' : 'text-foreground',
    subtitle: isDark ? 'text-white/50' : 'text-muted-foreground',
    pillActive: 'border-primary bg-primary text-primary-foreground',
    pillInactive: isDark
      ? 'border-white/15 bg-white/5 text-white/85 hover:border-primary/40 hover:bg-white/10'
      : 'border-border bg-background text-foreground hover:border-primary/40',
    checkbox: isDark ? 'text-white/90' : 'text-foreground/90',
    dateInput: isDark
      ? 'border-white/15 bg-ticket-page text-white'
      : 'border-input bg-background'
  };
}

function FilterPill({
  label,
  active,
  onClick,
  compact = false,
  theme = 'default'
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
  theme?: FilterTheme;
}) {
  const styles = useThemeClasses(theme);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border font-semibold transition-colors snap-start',
        compact ? 'px-3.5 py-2 text-xs' : 'px-4 py-2.5 text-sm',
        active ? styles.pillActive : styles.pillInactive
      )}
    >
      {label}
    </button>
  );
}

function FilterSection({
  title,
  children,
  layout,
  theme = 'default'
}: {
  title: string;
  children: React.ReactNode;
  layout: FilterLayout;
  theme?: FilterTheme;
}) {
  const styles = useThemeClasses(theme);

  if (layout === 'sheet') return null;

  return (
    <div
      className={cn(
        'border-b py-5 first:pt-0 last:border-b-0',
        styles.sectionBorder,
        layout === 'grid' && 'md:border-0 md:py-0'
      )}
    >
      <h3 className={cn('text-sm font-bold', styles.title)}>{title}</h3>
      <div
        className={cn(
          'mt-3',
          layout === 'list' && 'space-y-2.5',
          (layout === 'pills' || layout === 'grid') && 'flex flex-wrap gap-2'
        )}
      >
        {children}
      </div>
    </div>
  );
}

function SheetSection({
  title,
  children,
  defaultOpen = true,
  activeCount = 0,
  theme = 'dark'
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  activeCount?: number;
  theme?: FilterTheme;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const styles = useThemeClasses(theme);

  return (
    <div className={cn('border-b last:border-b-0', styles.sectionBorder)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('text-sm font-bold', styles.title)}>{title}</span>
          {activeCount > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-white/40 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function HorizontalChipRow({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory',
        className
      )}
    >
      {children}
    </div>
  );
}

function FilterCheckbox({
  id,
  label,
  checked,
  onChange,
  theme = 'default'
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  theme?: FilterTheme;
}) {
  const styles = useThemeClasses(theme);
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center gap-2.5 text-sm',
        styles.checkbox
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-white/20 accent-primary"
      />
      {label}
    </label>
  );
}

type FilterCategory = { slug: string; name: string };

interface EventsFilterContentProps {
  filters: EventsFilters;
  onChange: (filters: EventsFilters) => void;
  layout?: FilterLayout;
  theme?: FilterTheme;
  showTitle?: boolean;
  categories?: FilterCategory[];
}

export function EventsFilterContent({
  filters,
  onChange,
  layout = 'list',
  theme = 'default',
  showTitle = false,
  categories = mockCategories
}: EventsFilterContentProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const styles = useThemeClasses(theme);
  const isSheet = layout === 'sheet';
  const pillLayout = isSheet ? 'sheet' : layout;
  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, isSheet ? 12 : layout === 'list' ? 5 : 8);

  const renderPrice = (compact = false) =>
    priceOptions.map((opt) =>
      layout === 'list' ? (
        <FilterCheckbox
          key={opt.id}
          id={`price-${opt.id}`}
          label={opt.label}
          checked={filters.price.includes(opt.id)}
          theme={theme}
          onChange={(checked) =>
            onChange({
              ...filters,
              price: toggleFilterItem(filters.price, opt.id, checked)
            })
          }
        />
      ) : (
        <FilterPill
          key={opt.id}
          label={opt.label}
          active={filters.price.includes(opt.id)}
          compact={compact}
          theme={theme}
          onClick={() =>
            onChange({
              ...filters,
              price: toggleFilterItem(
                filters.price,
                opt.id,
                !filters.price.includes(opt.id)
              )
            })
          }
        />
      )
    );

  const renderDate = (compact = false) => (
    <>
      {dateOptions.map((opt) =>
        layout === 'list' ? (
          <FilterCheckbox
            key={opt.id}
            id={`date-${opt.id}`}
            label={opt.label}
            checked={filters.date.includes(opt.id)}
            theme={theme}
            onChange={(checked) =>
              onChange({
                ...filters,
                date: toggleFilterItem(filters.date, opt.id, checked)
              })
            }
          />
        ) : (
          <FilterPill
            key={opt.id}
            label={opt.label}
            active={filters.date.includes(opt.id)}
            compact={compact}
            theme={theme}
            onClick={() =>
              onChange({
                ...filters,
                date: toggleFilterItem(
                  filters.date,
                  opt.id,
                  !filters.date.includes(opt.id)
                )
              })
            }
          />
        )
      )}
      {filters.date.includes('pick') && (
        <input
          type="date"
          value={filters.customDate}
          onChange={(e) =>
            onChange({ ...filters, customDate: e.target.value })
          }
          className={cn(
            'rounded-xl border px-3 py-2.5 text-sm',
            styles.dateInput,
            isSheet ? 'mt-2 w-full' : layout !== 'list' && 'w-full'
          )}
        />
      )}
    </>
  );

  const renderCategories = (compact = false) => (
    <>
      {visibleCategories.map((cat) =>
        layout === 'list' ? (
          <FilterCheckbox
            key={cat.slug}
            id={`cat-${cat.slug}`}
            label={cat.name}
            checked={filters.categories.includes(cat.slug)}
            theme={theme}
            onChange={(checked) =>
              onChange({
                ...filters,
                categories: toggleFilterItem(
                  filters.categories,
                  cat.slug,
                  checked
                )
              })
            }
          />
        ) : (
          <FilterPill
            key={cat.slug}
            label={cat.name}
            active={filters.categories.includes(cat.slug)}
            compact={compact}
            theme={theme}
            onClick={() =>
              onChange({
                ...filters,
                categories: toggleFilterItem(
                  filters.categories,
                  cat.slug,
                  !filters.categories.includes(cat.slug)
                )
              })
            }
          />
        )
      )}
      {categories.length > visibleCategories.length && (
        <button
          type="button"
          onClick={() => setShowAllCategories(!showAllCategories)}
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          {showAllCategories ? 'Daha az' : 'Daha fazla'}
        </button>
      )}
    </>
  );

  const renderFormats = (compact = false) =>
    formatOptions.map((opt) =>
      layout === 'list' ? (
        <FilterCheckbox
          key={opt.id}
          id={`format-${opt.id}`}
          label={opt.label}
          checked={filters.formats.includes(opt.id)}
          theme={theme}
          onChange={(checked) =>
            onChange({
              ...filters,
              formats: toggleFilterItem(filters.formats, opt.id, checked)
            })
          }
        />
      ) : (
        <FilterPill
          key={opt.id}
          label={opt.label}
          active={filters.formats.includes(opt.id)}
          compact={compact}
          theme={theme}
          onClick={() =>
            onChange({
              ...filters,
              formats: toggleFilterItem(
                filters.formats,
                opt.id,
                !filters.formats.includes(opt.id)
              )
            })
          }
        />
      )
    );

  if (isSheet) {
    return (
      <div>
        {showTitle && (
          <h2 className={cn('mb-3 text-lg font-bold', styles.title)}>
            Filtreler
          </h2>
        )}

        <SheetSection
          title="Kategori"
          defaultOpen
          activeCount={filters.categories.length}
          theme={theme}
        >
          <div className="flex flex-wrap gap-2">{renderCategories(true)}</div>
        </SheetSection>

        <SheetSection
          title="Fiyat"
          defaultOpen={false}
          activeCount={filters.price.length}
          theme={theme}
        >
          <HorizontalChipRow>{renderPrice(true)}</HorizontalChipRow>
        </SheetSection>

        <SheetSection
          title="Tarih"
          defaultOpen={false}
          activeCount={
            filters.date.length + (filters.customDate ? 1 : 0)
          }
          theme={theme}
        >
          <HorizontalChipRow>{renderDate(true)}</HorizontalChipRow>
        </SheetSection>

        <SheetSection
          title="Etkinlik Türü"
          defaultOpen={false}
          activeCount={filters.formats.length}
          theme={theme}
        >
          <HorizontalChipRow>{renderFormats(true)}</HorizontalChipRow>
        </SheetSection>
      </div>
    );
  }

  const sections =
    layout === 'grid' ? (
      <div className="grid gap-6 md:grid-cols-2">
        <FilterSection title="Kategori" layout={pillLayout} theme={theme}>
          {renderCategories()}
        </FilterSection>
        <FilterSection title="Fiyat" layout={pillLayout} theme={theme}>
          {renderPrice()}
        </FilterSection>
        <FilterSection title="Tarih" layout={pillLayout} theme={theme}>
          {renderDate()}
        </FilterSection>
        <FilterSection title="Etkinlik Türü" layout={pillLayout} theme={theme}>
          {renderFormats()}
        </FilterSection>
      </div>
    ) : (
      <>
        <FilterSection title="Kategori" layout={pillLayout} theme={theme}>
          {renderCategories()}
        </FilterSection>
        <FilterSection title="Fiyat" layout={pillLayout} theme={theme}>
          {renderPrice()}
        </FilterSection>
        <FilterSection title="Tarih" layout={pillLayout} theme={theme}>
          {renderDate()}
        </FilterSection>
        <FilterSection title="Etkinlik Türü" layout={pillLayout} theme={theme}>
          {renderFormats()}
        </FilterSection>
      </>
    );

  return (
    <div>
      {showTitle && (
        <h2 className={cn('mb-3 text-lg font-bold', styles.title)}>
          Filtreler
        </h2>
      )}
      {sections}
    </div>
  );
}

interface EventsFilterSidebarProps {
  filters: EventsFilters;
  onChange: (filters: EventsFilters) => void;
  className?: string;
}

export function EventsFilterSidebar({
  filters,
  onChange,
  className
}: EventsFilterSidebarProps) {
  return (
    <aside
      className={cn(
        'rounded-lg border border-white/10 bg-[#151b24] p-5',
        className
      )}
    >
      <EventsFilterContent
        filters={filters}
        onChange={onChange}
        layout="list"
        theme="dark"
        showTitle
      />
    </aside>
  );
}

export { defaultEventsFilters };
