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
  Plus,
  ScanLine,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const ORGANIZATOR_BRAND = 'Biletfeed Organizatör';

const navItems = [
  { href: '/organizator-panel/baslangic', label: 'Genel Bakış', icon: Home },
  { href: '/organizator-panel/etkinlikler', label: 'Etkinlikler', icon: Calendar },
  { href: '/organizator-panel/tarayici', label: 'Bilet Tara', icon: ScanLine },
  { href: '/organizator-panel/siparisler', label: 'Satışlar', icon: ShoppingBag },
  { href: '/organizator-panel/biletler', label: 'Biletler', icon: Ticket },
  { href: '/organizator-panel/organizasyon', label: 'Organizasyon', icon: Star },
  { href: '/organizator-panel/mekanlar', label: 'Mekanlar', icon: MapPin },
  { href: '/organizator-panel/moderasyon', label: 'Moderasyon', icon: Sparkles },
  { href: '/organizator-panel/iletisim', label: 'İletişim', icon: MessageCircle },
  { href: '/yardim', label: 'Yardım', icon: HelpCircle, external: true },
  { href: '/organizator-panel/ayarlar', label: 'Ayarlar', icon: Settings },
];

export function OrganizatorSidebar({
  organizationName,
  className,
}: {
  organizationName: string;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'bg-organizer-sidebar text-organizer-chrome flex w-[17.5rem] shrink-0 flex-col border-r border-white/10',
        className
      )}
    >
      <div className="border-b border-white/10 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-organizer-chrome-muted">
          Organizasyon
        </p>
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2.5 text-left text-sm font-medium text-white"
        >
          <span className="truncate">{organizationName}</span>
          <ChevronDown className="size-4 shrink-0 opacity-70" />
        </button>
        <Button
          asChild
          className="mt-3 h-10 w-full gap-2 bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Link href="/organizator-panel/etkinlik/yeni">
            <Plus className="size-4" strokeWidth={2} />
            Yeni Etkinlik
          </Link>
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/organizator-panel/baslangic' &&
              pathname.startsWith(item.href));

          const linkClassName = cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            active
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-organizer-chrome hover:bg-[var(--organizer-sidebar-hover)] hover:text-white'
          );

          const Icon = item.icon;

          if (item.external) {
            return (
              <a key={item.href} href={item.href} className={linkClassName}>
                <Icon className="size-[18px] shrink-0" strokeWidth={2} />
                {item.label}
              </a>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={linkClassName}>
              <Icon className="size-[18px] shrink-0" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 text-[11px] text-organizer-chrome-muted">
        © BiletFeed {new Date().getFullYear()}
      </div>
    </aside>
  );
}
