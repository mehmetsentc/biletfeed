'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { hasAnalyticsConsent } from '@/lib/cookies/consent';
import { isTrackingAuthorized } from '@/lib/tracking/att';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);
  // iOS native uygulamada ATT izni alınana kadar analytics kesin olarak kapalı
  // kalır (App Store Guideline 5.1.2). Web'de/Android'de her zaman true.
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

  if (!enabled || !trackingAuthorized || !GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
