'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from '@/components/providers';
import { OrganizatorHeader } from '@/components/organizator-panel/header';
import { OrganizatorSidebar } from '@/components/organizator-panel/sidebar';
import { cn } from '@/lib/utils';

export function OrganizatorShell({
  children,
  organizationName,
  displayName,
  userEmail
}: {
  children: React.ReactNode;
  organizationName: string;
  displayName: string;
  userEmail?: string;
}) {
  const t = useTranslations();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isWizard =
    pathname === '/organizator-panel/etkinlik/yeni' ||
    pathname === '/etkinlik/yeni';
  const isScanner =
    pathname === '/organizator-panel/tarayici' ||
    pathname === '/tarayici' ||
    pathname.startsWith('/giris-terminal/tarayici');

  if (isScanner) {
    return <div className="min-h-screen bg-[#0a0a0a]">{children}</div>;
  }

  // Server layout (terminal) zaten panel_session doğrular.
  // Client AuthGuard Firebase sync gecikmesinde /giris ↔ /baslangic yenileme
  // döngüsü + iskelet flash üretir — bu yüzden burada AuthGuard yok.

  if (isWizard) {
    return (
      <div className="organizer-surface min-h-screen bg-organizer-shell p-4 md:p-6 lg:p-8">
        {children}
      </div>
    );
  }

  return (
    <div className="organizer-surface bg-organizer-shell flex min-h-screen">
      <OrganizatorSidebar
        organizationName={organizationName}
        className={cn(
          'fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:static lg:z-auto lg:min-h-screen',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      />

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label={t.common.close}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <OrganizatorHeader
          displayName={displayName}
          userEmail={userEmail}
          organizationName={organizationName}
          mobileOpen={mobileOpen}
          onMenuClick={() => setMobileOpen((v) => !v)}
        />
        <main className="organizer-surface flex-1 overflow-auto bg-background p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
