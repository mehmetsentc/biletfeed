'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const DEBOUNCE_MS = 320;

export function FeedSearchInput({
  value,
  onChange,
  loading = false,
  placeholder = 'Haber, sanatçı veya etiket ara…'
}: {
  value: string;
  onChange: (next: string) => void;
  loading?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function schedule(next: string) {
    setDraft(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(next.trim());
    }, DEBOUNCE_MS);
  }

  return (
    <div className="relative mb-5 md:mb-6">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={draft}
        onChange={(e) => schedule(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border-border bg-card pl-10 pr-10"
        aria-label="Feed ara"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {loading ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
        {draft ? (
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Aramayı temizle"
            onClick={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              setDraft('');
              onChange('');
            }}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
