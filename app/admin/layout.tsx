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
  ArrowLeft
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { getTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/config/site';

const t = getTranslations();

const adminLinks = [
  { href: '/admin', label: t.admin.title, icon: LayoutDashboard },
  { href: '/admin/kullanicilar', label: t.admin.users, icon: Users },
  { href: '/admin/organizatorler', label: t.admin.organizers, icon: Users },
  { href: '/admin/etkinlikler', label: t.admin.events, icon: Calendar },
  { href: '/admin/kategoriler', label: t.admin.categories, icon: LayoutGrid },
  { href: '/admin/sehirler', label: t.admin.cities, icon: MapPin },
  { href: '/admin/mekanlar', label: t.admin.venues, icon: Building2 },
  { href: '/admin/siparisler', label: t.admin.orders, icon: ShoppingCart },
  { href: '/admin/islemler', label: t.admin.transactions, icon: CreditCard },
  { href: '/admin/analitik', label: t.admin.analytics, icon: BarChart3 },
  { href: '/admin/bannerlar', label: t.admin.banners, icon: Image },
  { href: '/admin/raporlar', label: t.admin.reports, icon: FileText },
  { href: '/admin/ayarlar', label: t.admin.settings, icon: Settings }
];

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AuthGuard requiredRole="ROLE_ADMIN">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r bg-muted/30 lg:block">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
              {siteConfig.name}
            </Link>
          </div>
          <nav className="space-y-1 p-4">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === link.href ||
                  (link.href !== '/admin' && pathname.startsWith(link.href))
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
