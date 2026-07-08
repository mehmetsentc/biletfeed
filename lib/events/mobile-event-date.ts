import { formatTurkeyDate, turkeyCalendarDayDiff } from '@/lib/datetime/istanbul';

/** Mobil kart alt satırı — "5 Gün Sonra", "2 Hafta Sonra" */
export function formatEventCountdown(dateStr: string, now = new Date()): string {
  const diffDays = turkeyCalendarDayDiff(dateStr, now);

  if (diffDays <= 0) return 'Bugün';
  if (diffDays === 1) return 'Yarın';
  if (diffDays < 7) return `${diffDays} Gün Sonra`;
  const weeks = Math.round(diffDays / 7);
  if (diffDays < 30) return `${weeks} Hafta Sonra`;
  const months = Math.round(diffDays / 30);
  return `${months} Ay Sonra`;
}

/** Mobil kart — "07 Temmuz Pazartesi" */
export function formatMobileEventDateLine(dateStr: string): string {
  return formatTurkeyDate(dateStr, {
    day: '2-digit',
    month: 'long',
    weekday: 'long'
  });
}
