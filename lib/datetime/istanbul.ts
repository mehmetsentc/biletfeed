export const TURKEY_TIMEZONE = 'Europe/Istanbul' as const;
export const TURKEY_LOCALE = 'tr-TR' as const;

export function toTurkeyDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatTurkeyDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return toTurkeyDate(value).toLocaleDateString(TURKEY_LOCALE, {
    timeZone: TURKEY_TIMEZONE,
    ...options
  });
}

export function formatTurkeyTime(value: Date | string): string {
  return toTurkeyDate(value).toLocaleTimeString(TURKEY_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TURKEY_TIMEZONE
  });
}

export function formatTurkeyDateLong(value: Date | string): string {
  const formatted = formatTurkeyDate(value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return formatted.charAt(0).toLocaleUpperCase(TURKEY_LOCALE) + formatted.slice(1);
}

export function formatTurkeyEventDate(value: Date | string): string {
  return formatTurkeyDate(value, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatTurkeyTimeRange(
  start: Date | string,
  end: Date | string
): string {
  const startTime = formatTurkeyTime(start);
  const endTime = formatTurkeyTime(end);
  const diffMs = toTurkeyDate(end).getTime() - toTurkeyDate(start).getTime();
  const diffH = diffMs / (60 * 60 * 1000);
  // No range if no gap or suspiciously long (> 36 h)
  if (diffH <= 0 || diffH > 36) return startTime;

  const startDay = turkeyCalendarDayKey(start);
  const endDay = turkeyCalendarDayKey(end);
  const suffix = startDay !== endDay ? ' (+1)' : '';
  return `${startTime} – ${endTime}${suffix}`;
}

export function formatTurkeyDateTimeLong(value: Date | string): string {
  return `${formatTurkeyDateLong(value)} · ${formatTurkeyTime(value)}`;
}

/**
 * Etkinlik detay sayfası için saat aralığı gösterimi.
 * Aynı gün: "20:00 – 23:00"
 * Ertesi gün: "20:00 – 02:00 (23 Temmuz)"
 */
export function formatEventTimeDisplay(
  start: Date | string,
  end: Date | string | undefined | null
): string {
  const startTime = formatTurkeyTime(start);
  if (!end) return startTime;

  const endDate = toTurkeyDate(end);
  const diffMs = endDate.getTime() - toTurkeyDate(start).getTime();
  const diffH = diffMs / (60 * 60 * 1000);
  if (diffH <= 0 || diffH > 36) return startTime;

  const endTime = formatTurkeyTime(end);
  const startDay = turkeyCalendarDayKey(start);
  const endDay = turkeyCalendarDayKey(end);

  if (startDay !== endDay) {
    const endDateLabel = endDate.toLocaleDateString(TURKEY_LOCALE, {
      timeZone: TURKEY_TIMEZONE,
      day: 'numeric',
      month: 'long'
    });
    return `${startTime} – ${endTime} (${endDateLabel})`;
  }
  return `${startTime} – ${endTime}`;
}

/** Europe/Istanbul için YYYY-MM-DD takvim günü */
export function turkeyCalendarDayKey(value: Date | string = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TURKEY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(toTurkeyDate(value));
}

/**
 * İki an arasındaki Türkiye takvim günü farkı (gece yarısı UTC/saat kayması hatası yok).
 * 0 = aynı gün, 1 = yarın, negatif = geçmiş.
 */
export function turkeyCalendarDayDiff(
  target: Date | string,
  from: Date | string = new Date()
): number {
  const targetKey = turkeyCalendarDayKey(target);
  const fromKey = turkeyCalendarDayKey(from);
  const targetUtc = Date.UTC(
    Number(targetKey.slice(0, 4)),
    Number(targetKey.slice(5, 7)) - 1,
    Number(targetKey.slice(8, 10))
  );
  const fromUtc = Date.UTC(
    Number(fromKey.slice(0, 4)),
    Number(fromKey.slice(5, 7)) - 1,
    Number(fromKey.slice(8, 10))
  );
  return Math.round((targetUtc - fromUtc) / 86_400_000);
}
