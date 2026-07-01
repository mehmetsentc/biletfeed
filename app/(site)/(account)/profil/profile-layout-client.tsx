'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileLayoutClient({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || user) return;
    const redirect = encodeURIComponent(pathname || '/profil');
    router.replace(`/kayit?redirect=${redirect}`);
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl animate-pulse space-y-6 p-6">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
