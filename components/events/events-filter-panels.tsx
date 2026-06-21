'use client';

import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { EventsFilterContent } from '@/components/events/events-filter-content';
import {
  clearAllFilters,
  countActiveFilters
} from '@/components/events/events-filter-utils';
import type { EventsFilters } from '@/components/events/events-filter-types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: EventsFilters;
  onChange: (filters: EventsFilters) => void;
  resultCount: number;
}

export function MobileFilterSheet({
  open,
  onOpenChange,
  filters,
  onChange,
  resultCount
}: MobileFilterSheetProps) {
  const activeCount = countActiveFilters(filters);

  return (
    <>
      <Button
        variant="outline"
        className="h-11 shrink-0 gap-2 rounded-xl border-border px-4 font-semibold"
        onClick={() => onOpenChange(true)}
      >
        <SlidersHorizontal className="size-4" />
        <span className="sr-only sm:not-sr-only">Filtre</span>
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'fixed inset-x-0 bottom-0 top-auto flex max-h-[92vh] w-full max-w-none flex-col translate-x-0 translate-y-0 gap-0 rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0 sm:max-w-none',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            '[&>button:last-child]:hidden'
          )}
        >
          <DialogHeader className="shrink-0 flex-row items-center justify-between space-y-0 border-b px-4 py-4">
            <DialogTitle className="text-lg">Filtreler</DialogTitle>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => onChange(clearAllFilters())}
                >
                  Temizle
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                aria-label="Kapat"
              >
                <X className="size-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <EventsFilterContent
              filters={filters}
              onChange={onChange}
              layout="pills"
            />
          </div>

          <div className="shrink-0 border-t bg-background px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button
              className="h-12 w-full rounded-xl text-base font-bold"
              onClick={() => onOpenChange(false)}
            >
              {resultCount} etkinliği göster
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface TabletFilterPanelProps {
  filters: EventsFilters;
  onChange: (filters: EventsFilters) => void;
  resultCount: number;
}

export function TabletFilterPanel({
  filters,
  onChange,
  resultCount
}: TabletFilterPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = countActiveFilters(filters);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="size-5 text-primary" />
          <div>
            <p className="font-bold">Filtreler</p>
            <p className="text-sm text-muted-foreground">
              {activeCount > 0
                ? `${activeCount} filtre aktif · ${resultCount} sonuç`
                : `${resultCount} etkinlik`}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'size-5 text-muted-foreground transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && (
        <div className="border-t px-5 pb-5 pt-2">
          <div className="mb-4 flex justify-end">
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(clearAllFilters())}
              >
                Temizle
              </Button>
            )}
          </div>
          <EventsFilterContent
            filters={filters}
            onChange={onChange}
            layout="grid"
          />
        </div>
      )}
    </div>
  );
}
