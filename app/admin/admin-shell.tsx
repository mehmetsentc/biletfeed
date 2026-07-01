'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  LayoutGrid,
  MapPin,
  Building2,
  ShoppingCart,
  CreditCard,
  Settings,
  BarChart3,
  Image,
  FileText,
  Ticket,
  Rss,
  Clock,
  Shield
} from 'lucide-react';
import { getTranslations } from '@/lib/i18n';
import { Logo } from '@/components/brand/logo';
import { ProfileDropdown } from '@/components/layout/profile-dropdown';
import {
  canAccessAdminNavPath,
  type AdminPermission
} from '@/lib/auth/admin-permissions';
import { cn } from '@/lib/utils';

const t = getTranslations();

const adminLinks = [
  { href: '/admin', label: t.admin.title, icon: LayoutDashboard },
  { href: '/admin/kullanicilar', label: t.admin.users, icon: Users },
  { href: '/admin/organizatorler', label: t.admin.organizers, icon: Users },
  { href: '/admin/etkinlikler', label: t.admin.events, icon: Calendar },
  { href: '/admin/etkinlik-onay', label: 'Etkinlik Onay', icon: Clock },
  { href: '/admin/feed', label: 'Feed', icon: Rss },
  { href: '/admin/kategoriler', label: t.admin.categories, icon: LayoutGrid },
  { href: '/admin/sehirler', label: t.admin.cities, icon: MapPin },
  { href: '/admin/mekanlar', label: t.admin.venues, icon: Building2 },
  { href: '/admin/siparisler', label: t.admin.orders, icon: ShoppingCart },
  { href: '/admin/biletler', label: 'Biletler', icon: Ticket },
  { href: '/admin/islemler', label: t.admin.transactions, icon: CreditCard },
  { href: '/admin/analitik', label: t.admin.analytics, icon: BarChart3 },
  { href: '/admin/bannerlar', label: t.admin.banners, icon: Image },
  { href: '/admin/muhasebe', label: 'Muhasebe', icon: FileText },
  { href: '/admin/ayarlar', label: t.admin.settings, icon: Settings },
  { href: '/admin/yoneticiler', label: 'Admin Yönetimi', icon: Shield, superAdminOnly: true }
] as const;

interface AdminShellProps {
  children: React.ReactNode;
  isSuperAdmin: boolean;
  permissions: AdminPermission[];
}

export function AdminShell({
  children,
  isSuperAdmin,
  permissions
}: AdminShellProps) {
  const pathname = usePathname();

  const access = { isSuperAdmin, permissions, userId: '', role: 'ROLE_ADMIN' as const };
  const visibleLinks = adminLinks.filter((link) => {
    if ('superAdminOnly' in link && link.superAdminOnly) {
      return isSuperAdmin;
    }
    return canAccessAdminNavPath(access, link.href);
  });

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className="hidden w-64 shrink-0 border-r lg:block"
        style={{
          backgroundColor: 'var(--admin-sidebar-bg)',
          borderColor: 'var(--admin-sidebar-border)'
        }}
      >
        <div
          className="flex h-16 items-center border-b px-6"
          style={{ borderColor: 'var(--admin-sidebar-border)' }}
        >
          <Logo href="/admin" variant="on-dark" className="max-w-[150px]" />
        </div>
        <nav className="space-y-1 p-4">
          {visibleLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== '/admin' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-[var(--radius-button)] px-3 py-2.5 text-sm font-semibold transition-colors duration-[var(--duration-fast)]',
                  active
                    ? 'bg-[var(--admin-sidebar-active)] text-[var(--bf-text)] shadow-[var(--shadow-sm)]'
                    : 'hover:bg-[var(--admin-sidebar-hover)]'
                )}
                style={
                  active
                    ? undefined
                    : { color: 'var(--admin-sidebar-fg)' }
                }
              >
                <link.icon className="size-[18px]" strokeWidth={2} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end border-b bg-background px-4 md:px-6">
          <ProfileDropdown />
        </header>
        <main className="flex-1 overflow-auto bg-[var(--bf-surface)]">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
