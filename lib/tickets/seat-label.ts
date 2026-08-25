import {
  parseSectionSeatUnitId,
  parseSeatUnitCode
} from '@/lib/tickets/seat-packages';

/** attendeeName / seatUnitId alanından koltuk etiketini çıkar */
export function extractSeatUnitId(params: {
  seatUnitId?: string | null;
  attendeeName?: string | null;
}): string | null {
  const direct = params.seatUnitId?.trim();
  if (direct) return direct.toUpperCase();

  const name = params.attendeeName?.trim() ?? '';
  if (!name) return null;

  const fromSection = parseSectionSeatUnitId(name);
  if (fromSection) return fromSection;

  const fromTable = parseSeatUnitCode(name);
  if (fromTable) return fromTable;

  const m = name.match(/·\s*([A-Z0-9-]{2,24})\s*$/i);
  if (m?.[1]) return m[1].toUpperCase();

  return null;
}

export function formatSeatsLabel(
  tickets: Array<{ seatUnitId?: string | null; attendeeName?: string | null }>
): string {
  const seats = tickets
    .map((t) => extractSeatUnitId(t))
    .filter((s): s is string => Boolean(s));
  const unique = [...new Set(seats)];
  if (unique.length === 0) return '—';
  return unique.join(', ');
}
