'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isWizard =
    pathname === '/organizator-panel/etkinlik/yeni' ||
    pathname === '/etkinlik/yeni';
  const isScanner =
    pathname === '/organizator-panel/tarayici' || pathname === '/tarayici';

  if (isWizard || isScanner) {
    return (
      <AuthGuard requiredRole="ROLE_ORGANIZER">
        <div
          className={cn(
            'min-h-screen',
            isScanner ? 'bg-[#0a0a0a]' : 'organizer-surface bg-organizer-shell p-4 md:p-6 lg:p-8'
          )}
        >
          {children}
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="ROLE_ORGANIZER">
      <div className="organizer-surface bg-organizer-shell flex min-h-screen">
        {/* Sidebar — masaüstünde tam yükseklik, logo burada tek */}
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
            aria-label="Menüyü kapat"
          />
        )}

        {/* Ana sütun — header sidebar genişliğinin dışında */}
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
    </AuthGuard>
  );
}
