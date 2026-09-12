'use client';

import { CalendarDays, Home, MoreHorizontal } from 'lucide-react';
import type { HotTicketsTab } from '@/components/deneme/hot-tickets/bottom-nav';
import type { HotTicketsPlatform } from '@/components/deneme/hot-tickets/platform';
import { PLATFORM_LABEL } from '@/components/deneme/hot-tickets/platform';
import { hotTicketsTheme as T } from '@/components/deneme/hot-tickets/theme';

const TABS: Array<{
  id: HotTicketsTab;
  label: string;
  Icon: typeof Home;
}> = [
  { id: 'home', label: 'Keşfet', Icon: Home },
  { id: 'calendar', label: 'Takvim', Icon: CalendarDays },
  { id: 'more', label: 'Daha fazla', Icon: MoreHorizontal }
];

type SideNavProps = {
  active: HotTicketsTab;
  onChange: (tab: HotTicketsTab) => void;
  platform: HotTicketsPlatform;
};

export function SideNav({ active, onChange, platform }: SideNavProps) {
  const tv = platform === 'tv';

  return (
    <nav
      className={`flex flex-col ${tv ? 'gap-3' : 'gap-1'}`}
      aria-label="Ana menü"
    >
      <div className={`mb-4 ${tv ? 'mb-8' : ''}`}>
        <p className={`font-bold tracking-tight text-zinc-900 ${tv ? 'text-3xl' : 'text-xl'}`}>
          Hot Tickets
        </p>
        <p className={`mt-1 text-zinc-400 ${tv ? 'text-base' : 'text-xs'}`}>
          {PLATFORM_LABEL[platform]} · İstanbul
        </p>
      </div>

      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            data-ht-nav={id}
            className={`flex items-center gap-3 rounded-2xl text-left font-semibold transition ${
              tv ? 'min-h-[72px] px-5 text-xl' : 'min-h-[48px] px-3.5 text-sm'
            }`}
            style={
              isActive
                ? { backgroundColor: T.accent, color: T.onAccent }
                : { color: '#52525b' }
            }
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className={tv ? 'size-7' : 'size-5'} strokeWidth={isActive ? 2.4 : 1.85} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
