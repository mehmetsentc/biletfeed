'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import type { ThemePreference } from '@/lib/cookies/theme-preference.constants';

const THEME_OPTIONS = [
  { value: 'system' as const, label: 'Otomatik', icon: Monitor },
  { value: 'light' as const, label: 'Açık', icon: Sun },
  { value: 'dark' as const, label: 'Koyu', icon: Moon }
];

type ThemeSelectorProps = {
  variant?: 'grid' | 'compact';
  className?: string;
  onThemeChange?: () => void;
};

export function ThemeSelector({ variant = 'grid', className, onThemeChange }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          variant === 'grid' ? 'h-16 animate-pulse rounded-xl bg-muted' : 'size-9',
          className
        )}
        aria-hidden
      />
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-col gap-0.5 p-1', className)} role="listbox" aria-label="Tema">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => {
                setTheme(value satisfies ThemePreference);
                onThemeChange?.();
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)} role="listbox" aria-label="Tema">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => {
              setTheme(value satisfies ThemePreference);
              onThemeChange?.();
            }}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 py-3 text-xs font-semibold transition-all',
              active
                ? 'border-primary bg-primary/8 text-primary'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            <Icon className={cn('size-5', active && 'text-primary')} strokeWidth={active ? 2.25 : 1.75} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export { THEME_OPTIONS };
