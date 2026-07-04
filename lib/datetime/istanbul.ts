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
  const diffH =
    (toTurkeyDate(end).getTime() - toTurkeyDate(start).getTime()) / (60 * 60 * 1000);
  if (diffH <= 0 || diffH > 8) return startTime;
  return `${startTime} – ${endTime}`;
}

export function formatTurkeyDateTimeLong(value: Date | string): string {
  return `${formatTurkeyDateLong(value)} · ${formatTurkeyTime(value)}`;
}
