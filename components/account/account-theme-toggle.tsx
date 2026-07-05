'use client';

import { ThemeSelector } from '@/components/theme/theme-selector';
import { cn } from '@/lib/utils';

type AccountThemeToggleProps = {
  variant?: 'dropdown' | 'sidebar';
};

export function AccountThemeToggle({
  variant = 'dropdown'
}: AccountThemeToggleProps) {
  const isSidebar = variant === 'sidebar';

  return (
    <div
      className={cn(
        isSidebar ? 'px-3 py-2' : 'px-4 py-3'
      )}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Tema
      </p>
      <ThemeSelector variant="grid" />
    </div>
  );
}
