'use client';

import { useState } from 'react';
import { categories } from '@/lib/data/mock-events';
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

function FilterPill({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-foreground hover:border-primary/40'
      )}
    >
      {label}
    </button>
  );
}

function FilterSection({
  title,
  children,
  layout
}: {
  title: string;
  children: React.ReactNode;
  layout: 'list' | 'pills' | 'grid';
}) {
  return (
    <div
      className={cn(
        'border-b border-border py-5 first:pt-0 last:border-b-0',
        layout === 'grid' && 'md:border-0 md:py-0'
      )}
    >
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <div
        className={cn(
          'mt-3',
          layout === 'list' && 'space-y-2.5',
          layout === 'pills' && 'flex flex-wrap gap-2',
          layout === 'grid' && 'flex flex-wrap gap-2'
        )}
      >
        {children}
      </div>
    </div>
  );
}

function FilterCheckbox({
  id,
  label,
  checked,
  onChange
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/90"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border accent-primary"
      />
      {label}
    </label>
  );
}

interface EventsFilterContentProps {
  filters: EventsFilters;
  onChange: (filters: EventsFilters) => void;
  layout?: 'list' | 'pills' | 'grid';
  showTitle?: boolean;
}

export function EventsFilterContent({
  filters,
  onChange,
  layout = 'list',
  showTitle = false
}: EventsFilterContentProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, layout === 'list' ? 5 : 8);

  const renderPrice = () =>
    priceOptions.map((opt) =>
      layout === 'list' ? (
        <FilterCheckbox
          key={opt.id}
          id={`price-${opt.id}`}
          label={opt.label}
          checked={filters.price.includes(opt.id)}
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

  const renderDate = () => (
    <>
      {dateOptions.map((opt) =>
        layout === 'list' ? (
          <FilterCheckbox
            key={opt.id}
            id={`date-${opt.id}`}
            label={opt.label}
            checked={filters.date.includes(opt.id)}
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
            'rounded-xl border border-input bg-background px-3 py-2.5 text-sm',
            layout !== 'list' && 'w-full'
          )}
        />
      )}
    </>
  );

  const renderCategories = () => (
    <>
      {visibleCategories.map((cat) =>
        layout === 'list' ? (
          <FilterCheckbox
            key={cat.slug}
            id={`cat-${cat.slug}`}
            label={cat.name}
            checked={filters.categories.includes(cat.slug)}
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
          className="text-sm font-medium text-primary hover:underline"
        >
          {showAllCategories ? 'Daha az' : 'Daha fazla'}
        </button>
      )}
    </>
  );

  const renderFormats = () =>
    formatOptions.map((opt) =>
      layout === 'list' ? (
        <FilterCheckbox
          key={opt.id}
          id={`format-${opt.id}`}
          label={opt.label}
          checked={filters.formats.includes(opt.id)}
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

  const sections =
    layout === 'grid' ? (
      <div className="grid gap-6 md:grid-cols-2">
        <FilterSection title="Fiyat" layout={layout}>
          {renderPrice()}
        </FilterSection>
        <FilterSection title="Tarih" layout={layout}>
          {renderDate()}
        </FilterSection>
        <FilterSection title="Kategori" layout={layout}>
          {renderCategories()}
        </FilterSection>
        <FilterSection title="Format" layout={layout}>
          {renderFormats()}
        </FilterSection>
      </div>
    ) : (
      <>
        <FilterSection title="Fiyat" layout={layout}>
          {renderPrice()}
        </FilterSection>
        <FilterSection title="Tarih" layout={layout}>
          {renderDate()}
        </FilterSection>
        <FilterSection title="Kategori" layout={layout}>
          {renderCategories()}
        </FilterSection>
        <FilterSection title="Format" layout={layout}>
          {renderFormats()}
        </FilterSection>
      </>
    );

  return (
    <div>
      {showTitle && <h2 className="mb-3 text-lg font-bold">Filtreler</h2>}
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
      className={cn('rounded-lg border border-border bg-card p-5', className)}
    >
      <EventsFilterContent
        filters={filters}
        onChange={onChange}
        layout="list"
        showTitle
      />
    </aside>
  );
}

export { defaultEventsFilters };