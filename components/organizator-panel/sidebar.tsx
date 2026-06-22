'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  ChevronDown,
  HelpCircle,
  Home,
  MapPin,
  MessageCircle,
  ScanLine,
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ORGANIZATOR_BRAND = 'Biletfeed Organizatör';

const navItems = [
  { href: '/organizator-panel/baslangic', label: 'Başlangıç', icon: Home },
  { href: '/organizator-panel/etkinlikler', label: 'Etkinlik', icon: Calendar },
  { href: '/organizator-panel/organizasyon', label: 'Organizasyon', icon: Star },
  { href: '/organizator-panel/mekanlar', label: 'Mekan & Koltuk', icon: MapPin },
  { href: '/organizator-panel/moderasyon', label: 'Moderasyon', icon: Sparkles },
  { href: '/organizator-panel/tarayici', label: 'Bilet Gişesi', icon: ScanLine },
  { href: '/organizator-panel/siparisler', label: 'Siparişler', icon: ShoppingCart },
  { href: '/organizator-panel/biletler', label: 'Biletler', icon: Ticket },
  { href: '/organizator-panel/iletisim', label: 'İletişim', icon: MessageCircle },
  { href: '/yardim', label: 'Yardım', icon: HelpCircle, external: true },
  { href: '/organizator-panel/ayarlar', label: 'Ayarlar', icon: Settings }
];

export function OrganizatorSidebar({
  organizationName,
  className
}: {
  organizationName: string;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex w-64 shrink-0 flex-col bg-[#2b3035] text-zinc-100',
        className
      )}
    >
      <div className="border-b border-white/10 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Organizasyon
        </p>
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-between rounded-md bg-[#1f2327] px-3 py-2 text-left text-sm font-medium"
        >
          <span className="truncate">{organizationName}</span>
          <ChevronDown className="size-4 shrink-0 opacity-70" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/organizator-panel/baslangic' &&
              pathname.startsWith(item.href));

          const className = cn(
            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
            active
              ? 'bg-[#3d444b] text-white'
              : 'text-zinc-300 hover:bg-white/5 hover:text-white'
          );

          const Icon = item.icon;

          if (item.external) {
            return (
              <a key={item.href} href={item.href} className={className}>
                <Icon className="size-4 shrink-0 opacity-80" />
                {item.label}
              </a>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={className}>
              <Icon className="size-4 shrink-0 opacity-80" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 text-[11px] text-zinc-500">
        © Biletfeed {new Date().getFullYear()}
      </div>
    </aside>
  );
}
