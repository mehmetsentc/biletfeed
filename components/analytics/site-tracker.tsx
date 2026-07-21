'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { hasAnalyticsConsent } from '@/lib/cookies/consent';

const SESSION_KEY = 'bf_analytics_sid';

function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

function postBeacon(url: string, body: Record<string, unknown>) {
  const payload = JSON.stringify(body);
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    credentials: 'same-origin',
    keepalive: true
  }).catch(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    }
  });
}

function readUtms(searchParams: URLSearchParams) {
  return {
    utmSource: searchParams.get('utm_source'),
    utmMedium: searchParams.get('utm_medium'),
    utmCampaign: searchParams.get('utm_campaign')
  };
}

function readScrollDepth(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
  const el = document.documentElement;
  const scrollTop = window.scrollY || el.scrollTop;
  const height = el.scrollHeight - el.clientHeight;
  if (height <= 0) return 100;
  return Math.min(100, Math.round((scrollTop / height) * 100));
}

export function SiteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const maxScrollRef = useRef(0);

  useEffect(() => {
    if (!hasAnalyticsConsent()) return;
    if (!pathname) return;
    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/organizator-panel') ||
      pathname.startsWith('/giris-terminal') ||
      pathname.startsWith('/api')
    ) {
      return;
    }

    const fullPath =
      searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

    if (lastPathRef.current === fullPath) return;
    lastPathRef.current = fullPath;
    maxScrollRef.current = 0;

    if (!sessionIdRef.current) {
      sessionIdRef.current = getOrCreateSessionId();
    }

    const utms = readUtms(searchParams ?? new URLSearchParams());
    postBeacon('/api/track/pageview', {
      path: pathname,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      ...utms,
      sessionId: sessionIdRef.current,
      width: typeof window !== 'undefined' ? window.innerWidth : null
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!hasAnalyticsConsent()) return;
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/organizator-panel')) {
      return;
    }

    const onScroll = () => {
      const depth = readScrollDepth();
      if (depth <= maxScrollRef.current) return;
      maxScrollRef.current = depth;
      if (depth < 25 && depth % 25 !== 0) return;
      if (!sessionIdRef.current) sessionIdRef.current = getOrCreateSessionId();
      if (depth === 25 || depth === 50 || depth === 75 || depth >= 90) {
        postBeacon('/api/track/scroll', {
          sessionId: sessionIdRef.current,
          path: pathname,
          depth
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useReportWebVitals((metric) => {
    if (!hasAnalyticsConsent()) return;
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/organizator-panel')) {
      return;
    }
    const name = metric.name;
    if (name !== 'LCP' && name !== 'INP' && name !== 'CLS' && name !== 'TTFB') return;

    if (!sessionIdRef.current) {
      sessionIdRef.current = getOrCreateSessionId();
    }

    postBeacon('/api/track/web-vitals', {
      path: pathname,
      metric: name,
      value: metric.value,
      rating: metric.rating,
      sessionId: sessionIdRef.current
    });
  });

  return null;
}
