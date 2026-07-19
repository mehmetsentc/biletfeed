'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CitySlug } from '@/lib/location/cities';

type Suggestion = {
  placeId: string;
  name: string;
  secondaryText: string;
  description: string;
};

type PlaceSelection = {
  name: string;
  address: string;
  citySlug: CitySlug | null;
};

interface VenuePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceSelection) => void;
  cityHint?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function VenuePlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  cityHint,
  placeholder = 'Örn: Volkswagen Arena',
  className,
  disabled
}: VenuePlacesAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const query = value.trim();
    if (query.length < 2 || disabled) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: query });
        if (cityHint?.trim()) params.set('city', cityHint.trim());
        const res = await fetch(`/api/organizer/places/autocomplete?${params}`, {
          signal: controller.signal
        });
        const data = (await res.json()) as {
          suggestions?: Suggestion[];
          error?: string;
        };
        if (!res.ok) {
          if (res.status === 503) {
            setSuggestions([]);
            setOpen(false);
            return;
          }
          throw new Error(data.error || 'Arama başarısız');
        }
        const next = data.suggestions ?? [];
        setSuggestions(next);
        setOpen(next.length > 0);
        setActiveIndex(next.length > 0 ? 0 : -1);
      } catch (err) {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setOpen(false);
        setError(err instanceof Error ? err.message : 'Arama başarısız');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value, cityHint, disabled]);

  async function selectSuggestion(suggestion: Suggestion) {
    setResolving(true);
    setError(null);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
    try {
      const res = await fetch(
        `/api/organizer/places/details?placeId=${encodeURIComponent(suggestion.placeId)}`
      );
      const data = (await res.json()) as {
        place?: PlaceSelection & { placeId?: string };
        error?: string;
      };
      if (!res.ok || !data.place) {
        throw new Error(data.error || 'Mekan detayı alınamadı');
      }
      skipNextSearch.current = true;
      onChange(data.place.name);
      onPlaceSelect({
        name: data.place.name,
        address: data.place.address,
        citySlug: data.place.citySlug
      });
    } catch (err) {
      skipNextSearch.current = true;
      onChange(suggestion.name);
      onPlaceSelect({
        name: suggestion.name,
        address: suggestion.secondaryText || suggestion.description,
        citySlug: null
      });
      setError(err instanceof Error ? err.message : 'Adres doldurulamadı');
    } finally {
      setResolving(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          disabled={disabled || resolving}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!open || suggestions.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((i) => (i + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
            } else if (e.key === 'Enter' && activeIndex >= 0) {
              e.preventDefault();
              void selectSuggestion(suggestions[activeIndex]!);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          className={cn('h-11 rounded-lg pr-10', className)}
          autoComplete="off"
        />
        {(loading || resolving) && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.placeId} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors',
                  index === activeIndex ? 'bg-muted' : 'hover:bg-muted/70'
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => void selectSuggestion(suggestion)}
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--bf-accent-ink)]" />
                <span className="min-w-0">
                  <span className="block font-medium text-foreground">{suggestion.name}</span>
                  {suggestion.secondaryText ? (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {suggestion.secondaryText}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}
      {!error ? (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Listeden seçince adres otomatik dolar; isterseniz elle de düzenleyebilirsiniz.
        </p>
      ) : null}
    </div>
  );
}
