'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { OrganizatorHeader } from '@/components/organizator-panel/header';
import { OrganizatorSidebar } from '@/components/organizator-panel/sidebar';
import { cn } from '@/lib/utils';

export function OrganizatorShell({
  children,
  organizationName,
  displayName
}: {
  children: React.ReactNode;
  organizationName: string;
  displayName: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isWizard = pathname === '/organizator-panel/etkinlik/yeni';

  if (isWizard) {
    return (
      <AuthGuard requiredRole="ROLE_ORGANIZER">
        <div className="organizer-surface bg-organizer-shell min-h-screen p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="ROLE_ORGANIZER">
      <div className="organizer-surface bg-organizer-shell flex min-h-screen flex-col">
        <OrganizatorHeader
          displayName={displayName}
          onMenuClick={() => setMobileOpen((v) => !v)}
        />
        <div className="flex flex-1">
          <OrganizatorSidebar
            organizationName={organizationName}
            className={cn(
              'fixed inset-y-14 left-0 z-40 transition-transform lg:static lg:translate-x-0',
              mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}
          />
          {mobileOpen && (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Menüyü kapat"
            />
          )}
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
