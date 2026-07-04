import type { EventSeoMeta } from '@/lib/organizator/event-metadata';

export function parseEventSeriesMeta(seo: unknown): {
  seriesId: string;
  sessionIndex: number;
  sessionCount: number;
} | null {
  if (!seo || typeof seo !== 'object') return null;
  const meta = seo as EventSeoMeta;
  if (
    typeof meta.seriesId !== 'string' ||
    typeof meta.sessionIndex !== 'number' ||
    typeof meta.sessionCount !== 'number'
  ) {
    return null;
  }
  return {
    seriesId: meta.seriesId,
    sessionIndex: meta.sessionIndex,
    sessionCount: meta.sessionCount
  };
}

export function sessionSlugDateSuffix(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
