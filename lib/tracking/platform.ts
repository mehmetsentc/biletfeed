'use client';

import { useEffect, useState } from 'react';

type CapacitorLike = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

/** Sync tespit — Capacitor bridge inject edilmişse hemen native say. */
export function detectNativeAppSync(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as Window & { Capacitor?: CapacitorLike }).Capacitor;
  if (!cap) return false;
  if (typeof cap.isNativePlatform === 'function') {
    return cap.isNativePlatform();
  }
  if (typeof cap.getPlatform === 'function') {
    return cap.getPlatform() !== 'web';
  }
  return false;
}

/**
 * Uygulama Capacitor native shell (iOS/Android) içinde mi.
 * İlk render'da sync bridge varsa doğru değer; yoksa async doğrulanır.
 */
export function useIsNativeApp(): boolean {
  const [isNative, setIsNative] = useState(detectNativeAppSync);

  useEffect(() => {
    let cancelled = false;

    if (detectNativeAppSync()) {
      setIsNative(true);
      return;
    }

    import('@capacitor/core')
      .then(({ Capacitor }) => {
        if (!cancelled) {
          setIsNative(
            Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'web'
          );
        }
      })
      .catch(() => {
        if (!cancelled) setIsNative(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return isNative;
}

/**
 * Native/web ayrımı tamamlandı mı — install banner gibi web-only UI için.
 * Native olduğu anlaşılana veya Capacitor import'u bitene kadar false.
 */
export function useNativePlatformReady(): {
  ready: boolean;
  isNative: boolean;
} {
  const [state, setState] = useState(() => {
    const syncNative = detectNativeAppSync();
    return { ready: syncNative, isNative: syncNative };
  });

  useEffect(() => {
    let cancelled = false;

    if (detectNativeAppSync()) {
      setState({ ready: true, isNative: true });
      return;
    }

    import('@capacitor/core')
      .then(({ Capacitor }) => {
        if (cancelled) return;
        const isNative =
          Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'web';
        setState({ ready: true, isNative });
      })
      .catch(() => {
        if (!cancelled) setState({ ready: true, isNative: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
