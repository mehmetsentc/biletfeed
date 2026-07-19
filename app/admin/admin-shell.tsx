'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  Shield,
  Menu,
  X
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ProfileDropdown } from '@/components/layout/profile-dropdown';
import {
  canAccessAdminNavPath,
  type AdminPermission
} from '@/lib/auth/admin-permissions';
import { useTranslations } from '@/components/providers';
import { adminHref } from '@/lib/config/domain';
import { cn } from '@/lib/utils';

type AdminLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  superAdminOnly?: boolean;
};

function AdminNavLinks({
  links,
  pathname,
  onNavigate
}: {
  links: AdminLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1 p-4">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== '/admin' && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={adminHref(link.href)}
            onClick={onNavigate}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-[var(--radius-button)] px-3 py-2.5 text-sm font-semibold transition-colors duration-[var(--duration-fast)]',
              active
                ? 'bg-[var(--admin-sidebar-active)] text-[var(--bf-neon-on)] shadow-[var(--shadow-sm)]'
                : 'hover:bg-[var(--admin-sidebar-hover)]'
            )}
            style={active ? undefined : { color: 'var(--admin-sidebar-fg)' }}
          >
            <link.icon className="size-[18px]" strokeWidth={2} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations();

  const adminLinks: AdminLink[] = [
    { href: '/admin', label: t.admin.title, icon: LayoutDashboard },
    { href: '/admin/kullanicilar', label: t.admin.users, icon: Users },
    { href: '/admin/organizatorler', label: t.admin.organizers, icon: Users },
    { href: '/admin/etkinlikler', label: t.admin.events, icon: Calendar },
    { href: '/admin/etkinlik-onay', label: t.admin.eventApproval, icon: Clock },
    { href: '/admin/feed', label: t.admin.feed, icon: Rss },
    { href: '/admin/kategoriler', label: t.admin.categories, icon: LayoutGrid },
    { href: '/admin/sehirler', label: t.admin.cities, icon: MapPin },
    { href: '/admin/mekanlar', label: t.admin.venues, icon: Building2 },
    { href: '/admin/siparisler', label: t.admin.orders, icon: ShoppingCart },
    { href: '/admin/biletler', label: t.tickets.title, icon: Ticket },
    { href: '/admin/islemler', label: t.admin.transactions, icon: CreditCard },
    { href: '/admin/analitik', label: t.admin.analytics, icon: BarChart3 },
    { href: '/admin/bannerlar', label: t.admin.banners, icon: Image },
    { href: '/admin/muhasebe', label: t.admin.accounting, icon: FileText },
    { href: '/admin/ayarlar', label: t.admin.settings, icon: Settings },
    {
      href: '/admin/yoneticiler',
      label: t.admin.adminManagement,
      icon: Shield,
      superAdminOnly: true
    }
  ];

  const access = {
    isSuperAdmin,
    permissions,
    userId: '',
    role: 'ROLE_ADMIN' as const
  };
  const visibleLinks = adminLinks.filter((link) => {
    if (link.superAdminOnly) {
      return isSuperAdmin;
    }
    return canAccessAdminNavPath(access, link.href);
  });

  const sidebarStyle = {
    backgroundColor: 'var(--admin-sidebar-bg)',
    borderColor: 'var(--admin-sidebar-border)'
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className="hidden w-64 shrink-0 border-r lg:block"
        style={sidebarStyle}
      >
        <div
          className="flex h-16 items-center border-b px-6"
          style={{ borderColor: 'var(--admin-sidebar-border)' }}
        >
          <Logo href={adminHref('/')} variant="on-dark" className="max-w-[150px]" />
        </div>
        <AdminNavLinks links={visibleLinks} pathname={pathname} />
      </aside>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={sidebarStyle}
      >
        <div
          className="flex h-16 items-center justify-between border-b px-4"
          style={{ borderColor: 'var(--admin-sidebar-border)' }}
        >
          <Logo href={adminHref('/')} variant="on-dark" className="max-w-[130px]" />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex size-11 items-center justify-center rounded-lg hover:bg-[var(--admin-sidebar-hover)]"
            aria-label={t.common.close}
          >
            <X className="size-5" />
          </button>
        </div>
        <AdminNavLinks
          links={visibleLinks}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label={t.common.close}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-11 items-center justify-center rounded-lg text-foreground hover:bg-muted lg:hidden"
            aria-label={t.common.menu}
          >
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Logo href={adminHref('/')} variant="auto" className="max-w-[120px]" />
          </div>
          <div className="ml-auto">
            <ProfileDropdown />
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-[var(--bf-surface)]">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
