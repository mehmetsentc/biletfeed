'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  QrCode,
  Tag,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/lib/config/site';

const t = getTranslations();

const sidebarLinks = [
  { href: '/dashboard/etkinlik/yeni', label: 'Etkinlik Oluştur', icon: Calendar },
  { href: '/dashboard', label: t.dashboard.title, icon: LayoutDashboard },
  { href: '/dashboard/etkinlikler', label: t.dashboard.events, icon: Calendar },
  { href: '/dashboard/biletler', label: t.dashboard.tickets, icon: Ticket },
  { href: '/dashboard/siparisler', label: t.dashboard.orders, icon: ShoppingCart },
  { href: '/dashboard/analitik', label: t.dashboard.analytics, icon: BarChart3 },
  { href: '/dashboard/katilimcilar', label: t.dashboard.attendees, icon: Users },
  { href: '/dashboard/tarayici', label: t.dashboard.scanner, icon: QrCode },
  { href: '/dashboard/kuponlar', label: t.dashboard.coupons, icon: Tag },
  { href: '/dashboard/ai-asistan', label: t.dashboard.aiAssistant, icon: Sparkles },
  { href: '/dashboard/ayarlar', label: t.dashboard.settings, icon: Settings }
];

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWizard = pathname === '/dashboard/etkinlik/yeni';

  return (
    <AuthGuard requiredRole="ROLE_ORGANIZER">
      {isWizard ? (
        <div className="flex min-h-screen flex-col bg-background">
          <Header />
          <main className="flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>
          <Footer />
        </div>
      ) : (
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r bg-muted/30 lg:block">
            <div className="flex h-16 items-center border-b px-6">
              <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" />
                {siteConfig.name}
              </Link>
            </div>
            <nav className="space-y-1 p-4">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === link.href ||
                    (link.href !== '/dashboard' && pathname.startsWith(link.href))
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
          <main className="flex-1 overflow-auto bg-background">
            <div className="border-b p-4 lg:hidden">
              <p className="font-semibold">{t.dashboard.title}</p>
            </div>
            <div className="p-6">{children}</div>
          </main>
        </div>
      )}
    </AuthGuard>
  );
}
