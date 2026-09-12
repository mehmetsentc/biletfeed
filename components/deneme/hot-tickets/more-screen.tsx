'use client';

import {
  Bell,
  ChevronRight,
  Heart,
  Info,
  MapPinned,
  Moon,
  Ticket
} from 'lucide-react';
import { BottomNav, type HotTicketsTab } from '@/components/deneme/hot-tickets/bottom-nav';
import type { HotTicketsPlatform } from '@/components/deneme/hot-tickets/platform';
import { SideNav } from '@/components/deneme/hot-tickets/side-nav';
import { hotTicketsTheme as T } from '@/components/deneme/hot-tickets/theme';

type MoreScreenProps = {
  tab: HotTicketsTab;
  platform: HotTicketsPlatform;
  onTabChange: (tab: HotTicketsTab) => void;
};

const ROWS: Array<{
  icon: typeof Bell;
  label: string;
  hint: string;
}> = [
  { icon: MapPinned, label: 'Şehir', hint: 'İstanbul' },
  { icon: Bell, label: 'Bildirimler', hint: 'Açık' },
  { icon: Heart, label: 'Favoriler', hint: '3 kayıt' },
  { icon: Ticket, label: 'Biletlerim', hint: 'Demo' },
  { icon: Moon, label: 'Görünüm', hint: 'Açık tema' },
  { icon: Info, label: 'Hakkında', hint: 'Hot Tickets deneme' }
];

export function MoreScreen({ tab, platform, onTabChange }: MoreScreenProps) {
  const showSide = platform === 'web' || platform === 'tv';
  const showBottom = platform === 'mobile' || platform === 'tablet';

  return (
    <div
      className={`relative flex h-full ${showSide ? 'flex-row' : 'flex-col'} bg-white`}
    >
      {showSide ? (
        <aside
          className={`shrink-0 border-r border-zinc-100 ${
            platform === 'tv' ? 'w-[280px] px-6 py-8' : 'w-[220px] px-4 py-6'
          }`}
        >
          <SideNav active={tab} onChange={onTabChange} platform={platform} />
        </aside>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className={`shrink-0 ${
            platform === 'tv'
              ? 'px-10 pb-4 pt-8'
              : platform === 'web'
                ? 'px-8 pb-3 pt-6'
                : 'px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]'
          }`}
        >
          <h1
            className={`font-bold tracking-tight text-zinc-900 ${
              platform === 'tv' ? 'text-4xl' : 'text-[22px]'
            }`}
          >
            Daha fazla
          </h1>
          <p className={`mt-1 text-zinc-500 ${platform === 'tv' ? 'text-lg' : 'text-sm'}`}>
            Hesap ve ayarlar (local deneme)
          </p>
        </header>

        <div
          className={`min-h-0 flex-1 overflow-y-auto ${
            platform === 'tv'
              ? 'px-10 pb-10'
              : platform === 'web'
                ? 'max-w-2xl px-8 pb-8'
                : 'px-4 pb-4'
          }`}
        >
          <div
            className={`mb-4 rounded-2xl ${platform === 'tv' ? 'px-8 py-8' : 'px-4 py-4'}`}
            style={{ backgroundColor: T.accent, color: T.onAccent }}
          >
            <p className={`font-semibold opacity-80 ${platform === 'tv' ? 'text-lg' : 'text-sm'}`}>
              BiletFeed
            </p>
            <p className={`mt-1 font-bold ${platform === 'tv' ? 'text-3xl' : 'text-lg'}`}>
              Hot Tickets deneme
            </p>
            <p className={`mt-1 opacity-70 ${platform === 'tv' ? 'text-base' : 'text-xs'}`}>
              Platform: {platform} — yayına alınmamış UI prototipi
            </p>
          </div>

          <ul
            className={`overflow-hidden rounded-2xl border border-zinc-100 bg-white ${
              platform === 'web' || platform === 'tablet' ? 'grid grid-cols-2' : ''
            }`}
          >
            {ROWS.map(({ icon: Icon, label, hint }, index) => (
              <li key={label}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-3 text-left active:bg-zinc-50 ${
                    platform === 'tv' ? 'min-h-[88px] px-6 py-5' : 'px-4 py-3.5'
                  } ${
                    platform === 'web' || platform === 'tablet'
                      ? 'border-b border-zinc-100'
                      : index > 0
                        ? 'border-t border-zinc-100'
                        : ''
                  }`}
                >
                  <span
                    className={`flex items-center justify-center rounded-xl ${
                      platform === 'tv' ? 'size-14' : 'size-9'
                    }`}
                    style={{ backgroundColor: T.soft }}
                  >
                    <Icon
                      className={platform === 'tv' ? 'size-6' : 'size-4'}
                      style={{ color: T.ink }}
                      strokeWidth={2}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block font-semibold text-zinc-900 ${
                        platform === 'tv' ? 'text-xl' : 'text-[15px]'
                      }`}
                    >
                      {label}
                    </span>
                    <span
                      className={`block text-zinc-400 ${
                        platform === 'tv' ? 'text-base' : 'text-xs'
                      }`}
                    >
                      {hint}
                    </span>
                  </span>
                  <ChevronRight
                    className={platform === 'tv' ? 'size-6 text-zinc-300' : 'size-4 text-zinc-300'}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {showBottom ? <BottomNav active={tab} onChange={onTabChange} /> : null}
      </div>
    </div>
  );
}
