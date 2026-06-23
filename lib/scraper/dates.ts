/** Türkiye saati (UTC+3) — scraper tarihleri için */
const IST_OFFSET_MS = 3 * 60 * 60 * 1000;

const TZ_SUFFIX = /(?:[zZ]|[+-]\d{2}:\d{2})$/;

function istanbulFromParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  return new Date(
    Date.UTC(year, month, day, hour, minute, 0, 0) - IST_OFFSET_MS
  );
}

/**
 * Kaynak sitelerden gelen tarih/saat stringlerini doğru anlık zamana çevirir.
 * - Z veya ±offset içeren ISO → Date.parse (mutlak an)
 * - Saat dilimi yok → İstanbul yerel saati varsayılır
 * - Sadece tarih / 00:00 → defaultHour (20:00)
 */
export function parseScraperDateTime(
  text?: string | null,
  defaultHour = 20
): Date | null {
  if (!text?.trim()) return null;
  const raw = text.trim().replace(/T(\d{2})::(\d{2})/, 'T$1:$2');

  if (TZ_SUFFIX.test(raw)) {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }

  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return istanbulFromParts(
      +dateOnly[1],
      +dateOnly[2] - 1,
      +dateOnly[3],
      defaultHour,
      0
    );
  }

  const midnightIso = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})T00:00(?::00(?:\.\d+)?)?$/
  );
  if (midnightIso) {
    return istanbulFromParts(
      +midnightIso[1],
      +midnightIso[2] - 1,
      +midnightIso[3],
      defaultHour,
      0
    );
  }

  const withTime = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/
  );
  if (withTime) {
    const h = +withTime[4];
    const m = +withTime[5];
    if (h === 0 && m === 0) {
      return istanbulFromParts(
        +withTime[1],
        +withTime[2] - 1,
        +withTime[3],
        defaultHour,
        0
      );
    }
    return istanbulFromParts(
      +withTime[1],
      +withTime[2] - 1,
      +withTime[3],
      h,
      m
    );
  }

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed);
  }

  return null;
}

/** Bitiş saati yoksa yalnızca başlangıç (yanlış saat aralığı göstermemek için) */
export function inferEventEndDate(start: Date, endRaw?: string | null): Date {
  const parsedEnd = endRaw ? parseScraperDateTime(endRaw) : null;
  if (parsedEnd && parsedEnd.getTime() > start.getTime()) {
    return parsedEnd;
  }
  return new Date(start.getTime());
}

export function formatTimeTr(date: Date): string {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul'
  });
}

export function formatDateTr(date: Date): string {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul'
  });
}

/** Tarih parçası + HH:mm metni birleştirir (ör. Bubilet kartları) */
export function mergeDateWithTimeText(baseDate: Date, timeText: string): Date | null {
  const m = timeText.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hour = +m[1];
  const minute = +m[2];
  if (hour > 23 || minute > 59) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(baseDate);

  const year = +(parts.find((p) => p.type === 'year')?.value || 0);
  const month = +(parts.find((p) => p.type === 'month')?.value || 1) - 1;
  const day = +(parts.find((p) => p.type === 'day')?.value || 1);

  return istanbulFromParts(year, month, day, hour, minute);
}
