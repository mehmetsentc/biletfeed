/** Türkiye saati (UTC+3) — scraper tarihleri için */
const IST_OFFSET_MS = 3 * 60 * 60 * 1000;

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
 * Kaynak sitelerden gelen tarih/saat stringlerini İstanbul saatine çevirir.
 * Date-only ve gece yarısı (00:00) değerleri gerçek saat olmadığı varsayılır → 20:00.
 */
export function parseScraperDateTime(
  text?: string | null,
  defaultHour = 20
): Date | null {
  if (!text?.trim()) return null;
  const raw = text.trim().replace(/T(\d{2})::(\d{2})/, 'T$1:$2');

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
    /^(\d{4})-(\d{2})-(\d{2})T00:00(?::00(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/
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
    const d = new Date(parsed);
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && !raw.includes(':')) {
      return istanbulFromParts(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        defaultHour,
        0
      );
    }
    return d;
  }

  return null;
}

/** Bitiş saati yoksa başlangıç + 2 saat (konser/etkinlik varsayımı) */
export function inferEventEndDate(start: Date, endRaw?: string | null): Date {
  const parsedEnd = endRaw ? parseScraperDateTime(endRaw) : null;
  if (parsedEnd && parsedEnd.getTime() > start.getTime()) {
    return parsedEnd;
  }
  return new Date(start.getTime() + 2 * 60 * 60 * 1000);
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
