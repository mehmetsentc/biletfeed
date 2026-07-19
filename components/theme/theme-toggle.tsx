'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { ThemeSelector } from '@/components/theme/theme-selector';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const ActiveIcon =
    !mounted || theme === 'system'
      ? Monitor
      : resolvedTheme === 'dark'
        ? Moon
        : Sun;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-full text-[var(--header-fg)] transition-colors hover:bg-[var(--header-hover)] hover:text-[var(--bf-accent-ink)]',
          open && 'bg-[var(--header-hover)] text-[var(--bf-accent-ink)]'
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Tema seç"
      >
        <ActiveIcon className="size-[18px]" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 min-w-[168px] overflow-hidden rounded-[var(--radius-card)] border border-border/80 bg-background/95 py-1 shadow-[var(--shadow-lg)] backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-200"
          role="listbox"
          aria-label="Tema seçenekleri"
        >
          <ThemeSelector
            variant="compact"
            className="px-1"
            onThemeChange={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
