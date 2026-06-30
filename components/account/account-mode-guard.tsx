'use client';

import { useEffect } from 'react';
import { useAccountMode } from '@/hooks/use-account-mode';
import { panelHref } from '@/lib/config/domain';

export function EventJoyUserGuard({ children }: { children: React.ReactNode }) {
  const { isOrganizerMode, isModeLocked } = useAccountMode();

  useEffect(() => {
    if (isModeLocked && isOrganizerMode) {
      window.location.replace(panelHref('/organizator-panel/baslangic'));
    }
  }, [isOrganizerMode, isModeLocked]);

  if (isModeLocked && isOrganizerMode) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-muted-foreground">
        Yönlendiriliyor…
      </div>
    );
  }

  return <>{children}</>;
}
