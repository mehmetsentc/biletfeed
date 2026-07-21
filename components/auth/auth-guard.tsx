'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import type { UserRole } from '@/types';
import { hasRole } from '@/lib/auth/roles';
import { Skeleton } from '@/components/ui/skeleton';
import { isPanelAuthContext } from '@/lib/auth/panel-auth-context';
import { panelLoginHref, siteHref } from '@/lib/config/domain';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallbackUrl?: string;
}

export function AuthGuard({
  children,
  requiredRole = 'ROLE_USER',
  fallbackUrl
}: AuthGuardProps) {
  const { user, loading, sessionReady } = useAuth();
  const router = useRouter();
  const resolvedFallback =
    fallbackUrl ??
    (isPanelAuthContext() ? panelLoginHref() : siteHref('/giris'));

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(resolvedFallback);
      } else if (!sessionReady) {
        // Oturum çerezi henüz hazır değil — yönlendirme yapma
      } else if (!hasRole(user.role, requiredRole)) {
        // Panelde '/' → /baslangic döngüsü + siyah ekran; ana siteye gönder
        const unauthorized = isPanelAuthContext()
          ? siteHref('/?error=unauthorized')
          : siteHref('/?error=unauthorized');
        router.replace(unauthorized);
      }
    }
  }, [user, loading, sessionReady, requiredRole, resolvedFallback, router]);

  if (loading || (user && !sessionReady)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-md space-y-4 p-8">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!user || !sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        Oturum kontrol ediliyor…
      </div>
    );
  }

  if (!hasRole(user.role, requiredRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-muted-foreground">
        Bu sayfaya erişim yetkiniz yok. Yönlendiriliyorsunuz…
      </div>
    );
  }

  return <>{children}</>;
}
