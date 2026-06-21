'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const settingsLinks = [
  { href: '/profil', label: 'Hesap Bilgileri', shortLabel: 'Hesap' },
  { href: '/profil/email', label: 'E-posta Değiştir', shortLabel: 'E-posta' },
  { href: '/profil/sifre', label: 'Şifre', shortLabel: 'Şifre' }
];

function MobileSettingsTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
      aria-label="Hesap ayarları"
    >
      {settingsLinks.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {link.shortLabel}
          </Link>
        );
      })}
    </nav>
  );
}

function DesktopSettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-full shrink-0 border-r border-border bg-muted/40 md:block md:w-56 lg:w-64 xl:w-72">
      <div className="sticky top-20 p-6 lg:p-8">
        <h2 className="text-lg font-bold">Hesap Ayarları</h2>
        <nav className="mt-6 space-y-1">
          {settingsLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function AccountSettingsShell({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col md:min-h-[calc(100vh-5rem)] md:flex-row">
      <MobileSettingsTabs />
      <DesktopSettingsSidebar />
      <div className="min-w-0 flex-1 bg-background px-4 py-5 pb-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
        {children}
      </div>
    </div>
  );
}
