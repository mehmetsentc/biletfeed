'use client';

import { CalendarDays, Home, MoreHorizontal } from 'lucide-react';
import { hotTicketsTheme as T } from '@/components/deneme/hot-tickets/theme';

export type HotTicketsTab = 'home' | 'calendar' | 'more';

const TABS: Array<{
  id: HotTicketsTab;
  label: string;
  Icon: typeof Home;
}> = [
  { id: 'home', label: 'Ana', Icon: Home },
  { id: 'calendar', label: 'Takvim', Icon: CalendarDays },
  { id: 'more', label: 'Daha fazla', Icon: MoreHorizontal }
];

type BottomNavProps = {
  active: HotTicketsTab;
  onChange: (tab: HotTicketsTab) => void;
};

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="flex shrink-0 items-center justify-around border-t border-zinc-100/80 bg-white px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:px-16">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className="flex min-w-[72px] flex-col items-center gap-1 py-1.5 md:min-h-[56px] md:min-w-[96px]"
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className="size-6 md:size-7"
              strokeWidth={isActive ? 2.25 : 1.75}
              style={{ color: isActive ? T.accent : '#d4d4d8' }}
            />
            <span
              className="hidden text-[11px] font-semibold md:block"
              style={{ color: isActive ? T.ink : '#a1a1aa' }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
