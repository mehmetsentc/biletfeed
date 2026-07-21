'use client';

import { useEffect } from 'react';
import { hasAnalyticsConsent } from '@/lib/cookies/consent';

/** 404 sayfasında bir kez NotFoundLog kaydı */
export function NotFoundTracker() {
  useEffect(() => {
    if (!hasAnalyticsConsent()) return;
    const path = window.location.pathname + window.location.search;
    void fetch('/api/track/404', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        path,
        referrer: document.referrer || null
      }),
      keepalive: true
    }).catch(() => null);
  }, []);

  return null;
}
