import { hasAnalyticsConsent } from '@/lib/cookies/consent';

/** Site içi arama — consent varsa fire-and-forget log */
export function trackClientSearch(query: string, resultCount = 0): void {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;
  const q = query.trim();
  if (!q) return;
  void fetch('/api/track/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ query: q, resultCount }),
    keepalive: true
  }).catch(() => null);
}
