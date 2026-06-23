'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccountMode } from '@/hooks/use-account-mode';

export function EventJoyUserGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isOrganizerMode, isModeLocked } = useAccountMode();

  useEffect(() => {
    if (isModeLocked && isOrganizerMode) {
      router.replace('/organizator-panel/baslangic');
    }
  }, [isOrganizerMode, isModeLocked, router]);

  if (isModeLocked && isOrganizerMode) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-muted-foreground">
        Yönlendiriliyor…
      </div>
    );
  }

  return <>{children}</>;
}
