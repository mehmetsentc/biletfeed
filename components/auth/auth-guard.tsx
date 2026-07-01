'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import type { UserRole } from '@/types';
import { hasRole } from '@/lib/auth/roles';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallbackUrl?: string;
}

export function AuthGuard({
  children,
  requiredRole = 'ROLE_USER',
  fallbackUrl = '/giris'
}: AuthGuardProps) {
  const { user, loading, sessionReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(fallbackUrl);
      } else if (!sessionReady) {
        // Oturum çerezi henüz hazır değil — yönlendirme yapma
      } else if (!hasRole(user.role, requiredRole)) {
        router.replace('/');
      }
    }
  }, [user, loading, sessionReady, requiredRole, fallbackUrl, router]);

  if (loading || (user && !sessionReady)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!user || !sessionReady || !hasRole(user.role, requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
