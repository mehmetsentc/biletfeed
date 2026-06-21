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
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(fallbackUrl);
      } else if (!hasRole(user.role, requiredRole)) {
        router.replace('/');
      }
    }
  }, [user, loading, requiredRole, fallbackUrl, router]);

  if (loading) {
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

  if (!user || !hasRole(user.role, requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
