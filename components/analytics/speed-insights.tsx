'use client';

import { useEffect, useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { hasAnalyticsConsent } from '@/lib/cookies/consent';

export function AppSpeedInsights() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(hasAnalyticsConsent());
    sync();
    window.addEventListener('bf-cookie-consent-change', sync);
    return () => window.removeEventListener('bf-cookie-consent-change', sync);
  }, []);

  if (!enabled) return null;
  return <SpeedInsights />;
}
