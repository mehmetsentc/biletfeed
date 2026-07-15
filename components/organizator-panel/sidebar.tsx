'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  HelpCircle,
  Home,
  MapPin,
  MessageCircle,
  Plus,
  ScanLine,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import { useTranslations } from '@/components/providers';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ORGANIZATOR_BRAND = 'Biletfeed Organizatör';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
};

export function OrganizatorSidebar({
  organizationName,
  className,
}: {
  organizationName: string;
  className?: string;
}) {
  const pathname = usePathname();
  const t = useTranslations();
  const navItems = useMemo(
    (): NavItem[] => [
      { href: '/organizator-panel/baslangic', label: t.organizerNav.overview, icon: Home },
      { href: '/organizator-panel/etkinlikler', label: t.organizerNav.events, icon: Calendar },
      { href: '/organizator-panel/tarayici', label: t.organizerNav.scanner, icon: ScanLine },
      { href: '/organizator-panel/siparisler', label: t.organizerNav.sales, icon: ShoppingBag },
      { href: '/organizator-panel/biletler', label: t.organizerNav.tickets, icon: Ticket },
      { href: '/organizator-panel/davetiyeler', label: t.organizerNav.invitations, icon: Send },
      { href: '/organizator-panel/kuponlar', label: t.organizerNav.coupons, icon: Tag },
      { href: '/organizator-panel/organizasyon', label: t.organizerNav.organization, icon: Star },
      { href: '/organizator-panel/mekanlar', label: t.organizerNav.venues, icon: MapPin },
      { href: '/organizator-panel/moderasyon', label: t.organizerNav.moderation, icon: Sparkles },
      { href: '/organizator-panel/iletisim', label: t.organizerNav.contact, icon: MessageCircle },
      { href: '/organizator-panel/yardim', label: t.organizerNav.help, icon: HelpCircle },
      { href: '/organizator-panel/ayarlar', label: t.organizerNav.settings, icon: Settings },
    ],
    [t]
  );

  return (
    <aside
      className={cn(
        'bg-organizer-sidebar text-organizer-chrome flex w-[17.5rem] shrink-0 flex-col border-r border-white/10',
        className
      )}
    >
      <div className="border-b border-white/10 p-4">
        <Logo
          href="/organizator-panel/baslangic"
          variant="on-dark"
          className="mb-4 max-w-[160px]"
        />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-organizer-chrome-muted">
          {t.organizerNav.organization}
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
            {t.organizerNav.newEvent}
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
              <a
                key={item.href}
                href={item.href}
                className={linkClassName}
                target="_blank"
                rel="noopener noreferrer"
              >
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
