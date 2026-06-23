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
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface EventsFilterPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: EventsFilters;
  onChange: (filters: EventsFilters) => void;
  resultCount: number;
}

export function EventsFilterPanel({
  open,
  onOpenChange,
  filters,
  onChange,
  resultCount
}: EventsFilterPanelProps) {
  const activeCount = countActiveFilters(filters);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex max-h-[88dvh] w-full flex-col gap-0 overflow-hidden border-white/10 bg-[#151b24] p-0 text-white shadow-2xl',
          'max-md:!fixed max-md:!inset-x-0 max-md:!bottom-0 max-md:!top-auto max-md:!left-auto max-md:!max-w-none max-md:!translate-x-0 max-md:!translate-y-0 max-md:rounded-b-none max-md:rounded-t-2xl max-md:border-x-0 max-md:border-b-0',
          'md:max-h-[min(85vh,720px)] md:max-w-xl md:rounded-2xl'
        )}
      >
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20 md:hidden"
          aria-hidden
        />

        <DialogHeader className="shrink-0 space-y-0 border-b border-white/10 px-4 py-3.5 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-left">
              <DialogTitle className="text-lg font-bold text-white">
                Filtreler
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-white/50">
                {activeCount > 0
                  ? `${activeCount} filtre seçili`
                  : 'Etkinlikleri daraltın'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1">
              {activeCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:bg-white/10 hover:text-white"
                  onClick={() => onChange(clearAllFilters())}
                >
                  Temizle
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => onOpenChange(false)}
                aria-label="Kapat"
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <EventsFilterContent
            filters={filters}
            onChange={onChange}
            layout="sheet"
            theme="dark"
          />
        </div>

        <div className="shrink-0 border-t border-white/10 bg-[#0c1017] px-4 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:px-5">
          <Button
            className="h-12 w-full rounded-xl text-base font-bold"
            onClick={() => onOpenChange(false)}
          >
            {resultCount} etkinliği göster
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** @deprecated Use EventsFilterPanel */
export const MobileFilterSheet = EventsFilterPanel;

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
    <div className="rounded-2xl border border-white/10 bg-[#151b24]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="size-5 text-primary" />
          <div>
            <p className="font-bold text-white">Filtreler</p>
            <p className="text-sm text-white/50">
              {activeCount > 0
                ? `${activeCount} filtre aktif · ${resultCount} sonuç`
                : `${resultCount} etkinlik`}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'size-5 text-white/50 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-5 pb-5 pt-2">
          <div className="mb-4 flex justify-end">
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white/60 hover:bg-white/10 hover:text-white"
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
            theme="dark"
          />
        </div>
      )}
    </div>
  );
}
