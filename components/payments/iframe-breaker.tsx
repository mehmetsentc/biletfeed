'use client';

import { useEffect } from 'react';

/**
 * Tosla iframe içinden döndükten sonra parent pencereyi bu sayfaya yönlendirir.
 * Sadece iframe içindeyken çalışır.
 */
export function IframeBreaker() {
  useEffect(() => {
    if (window.self !== window.top) {
      window.top!.location.href = window.self.location.href;
    }
  }, []);
  return null;
}
