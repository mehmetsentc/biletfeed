'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type AccountThemeToggleProps = {
  variant?: 'dropdown' | 'sidebar';
};

export function AccountThemeToggle({
  variant = 'dropdown'
}: AccountThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const isSidebar = variant === 'sidebar';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex w-full items-center gap-3 text-sm font-medium text-foreground transition-colors hover:bg-muted',
        isSidebar ? 'rounded-xl px-3 py-2.5' : 'px-4 py-2.5'
      )}
    >
      {isDark ? (
        <Sun className="size-4 shrink-0" strokeWidth={1.75} />
      ) : (
        <Moon className="size-4 shrink-0" strokeWidth={1.75} />
      )}
      {isDark ? 'Açık Tema' : 'Koyu Tema'}
    </button>
  );
}
