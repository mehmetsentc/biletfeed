'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

/**
 * Oturum değişince (giriş, çıkış, hesap değişimi) sunucu bileşenlerini yeniler.
 * İlk yüklemede gereksiz refresh yapmaz; yalnızca sonraki uid değişimlerinde tetiklenir.
 */
export function AuthSessionSync() {
  const { user, sessionReady } = useAuth();
  const router = useRouter();
  const prevUidRef = useRef<string | null | undefined>(undefined);
  const mountedRef = useRef(false);

  useEffect(() => {
    const uid = sessionReady && user?.uid ? user.uid : null;

    if (prevUidRef.current !== uid) {
      if (mountedRef.current && prevUidRef.current !== undefined) {
        router.refresh();
      }
      prevUidRef.current = uid;
    }

    mountedRef.current = true;
  }, [user?.uid, sessionReady, router]);

  return null;
}
