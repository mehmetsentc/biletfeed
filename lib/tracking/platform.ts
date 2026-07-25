'use client';

import { useEffect, useState } from 'react';

/**
 * Uygulama şu an bir Capacitor native shell (iOS/Android) içinde mi
 * çalışıyor, yoksa normal tarayıcıda mı açık, tespit eder.
 *
 * Web'de her zaman `false` döner. Kullanım örneği: native uygulama
 * içinde diğer mağazalara (App Store içindeyken Google Play, vb.)
 * referans göstermemek (App Store Guideline 2.3.10).
 */
export function useIsNativeApp(): boolean {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('@capacitor/core')
      .then(({ Capacitor }) => {
        if (!cancelled) setIsNative(Capacitor.getPlatform() !== 'web');
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
