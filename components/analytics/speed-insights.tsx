'use client';

import { useEffect, useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { hasAnalyticsConsent } from '@/lib/cookies/consent';
import { isTrackingAuthorized } from '@/lib/tracking/att';

export function AppSpeedInsights() {
  const [enabled, setEnabled] = useState(false);
  // iOS native uygulamada ATT izni alınana kadar kesin olarak kapalı kalır
  // (App Store Guideline 5.1.2 / 5.1.1(iv)). Web'de/Android'de her zaman true.
  const [trackingAuthorized, setTrackingAuthorized] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(hasAnalyticsConsent());
    sync();
    window.addEventListener('bf-cookie-consent-change', sync);

    isTrackingAuthorized()
      .then(setTrackingAuthorized)
      .catch(() => setTrackingAuthorized(false));

    return () => window.removeEventListener('bf-cookie-consent-change', sync);
  }, []);

  if (!enabled || !trackingAuthorized) return null;
  return <SpeedInsights />;
}
