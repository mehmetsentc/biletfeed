/**
 * Tekrarlayan etkinlikte tek satırdaki başlangıç→bitiş tarih aralığını
 * günlük seans satırlarına açar. Festival (çok günlük tek seans) için
 * genişletme yapılmaz — her satır olduğu gibi kalır.
 */

export type ExpandableSessionRow = {
  id: string;
  eventId?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function newId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function isValidExpandableSession(session: ExpandableSessionRow): boolean {
  return Boolean(session.startDate?.trim() && session.startTime?.trim());
}

/**
 * Her geçerli seans satırı için: endDate > startDate ise aradaki her gün
 * ayrı seans olur (aynı saatlerle). Aksi halde satır tek seans olarak kalır.
 * Üst sınır: 50 seans.
 */
export function expandRecurringSessions(
  sessions: ExpandableSessionRow[],
  options?: { isFestival?: boolean; maxSessions?: number }
): ExpandableSessionRow[] {
  const isFestival = options?.isFestival ?? false;
  const maxSessions = options?.maxSessions ?? 50;
  const valid = sessions.filter(isValidExpandableSession);

  if (isFestival) return valid;

  const out: ExpandableSessionRow[] = [];

  for (const session of valid) {
    const rangeEnd =
      session.endDate?.trim() && session.endDate >= session.startDate
        ? session.endDate
        : session.startDate;

    let current = session.startDate;
    let dayIndex = 0;
    while (current <= rangeEnd) {
      if (out.length >= maxSessions) break;
      out.push({
        id: dayIndex === 0 ? session.id : newId(),
        ...(dayIndex === 0 && session.eventId ? { eventId: session.eventId } : {}),
        startDate: current,
        endDate: current,
        startTime: session.startTime,
        endTime: session.endTime
      });
      current = addDaysToDateStr(current, 1);
      dayIndex += 1;
    }
    if (out.length >= maxSessions) break;
  }

  return out;
}
