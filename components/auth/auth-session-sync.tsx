'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

/**
 * Oturum değişince sunucu bileşenlerini yeniler.
 * sessionReady geçişlerinde refresh yapılmaz — client formları sıfırlanmasın.
 */
export function AuthSessionSync() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const prevUidRef = useRef<string | null | undefined>(undefined);
  const mountedRef = useRef(false);

  useEffect(() => {
    const uid = user?.uid ?? null;

    if (prevUidRef.current !== uid) {
      const isOrganizerWizard =
        pathname.includes('/etkinlik/yeni') || pathname.includes('/duzenle');

      if (
        mountedRef.current &&
        prevUidRef.current !== undefined &&
        !isOrganizerWizard
      ) {
        router.refresh();
      }
      prevUidRef.current = uid;
    }

    mountedRef.current = true;
  }, [user?.uid, pathname, router]);

  return null;
}
