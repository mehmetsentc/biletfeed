/** Masa/loca paket bileti yardımcıları */

const UNIT_CODE_RE = /\b([SBMPT])\s*[-.]?\s*(\d+)\b/i;
/** Sections layout: P1-E11, P4-N16, VIP-E1 */
const SECTION_SEAT_RE = /\b((?:VIP|P\d+)-[A-Z]\d{1,3})\b/i;

export function parseSeatUnitCode(name: string): string | null {
  const match = name.match(UNIT_CODE_RE);
  if (!match) return null;
  return `${match[1]!.toUpperCase()}${match[2]}`;
}

/** Parse numbered seat unit id from ticket type name/description (sections layout). */
export function parseSectionSeatUnitId(text: string): string | null {
  const match = text.match(SECTION_SEAT_RE);
  if (!match?.[1]) return null;
  const raw = match[1];
  const dash = raw.indexOf('-');
  if (dash < 0) return raw.toUpperCase();
  return `${raw.slice(0, dash).toUpperCase()}-${raw.slice(dash + 1).toUpperCase()}`;
}

/** Match a seat-plan unit to its ticket type (per-seat or zone-level). */
export function matchTicketTypeToSeatUnit<T extends { name: string; description?: string | null }>(
  unitId: string,
  ticketTypeHint: string | undefined,
  ticketTypes: T[]
): T | undefined {
  const needle = unitId.toUpperCase();
  const byId = ticketTypes.find((tt) => {
    const fromName = parseSectionSeatUnitId(tt.name);
    const fromDesc = tt.description ? parseSectionSeatUnitId(tt.description) : null;
    return fromName === needle || fromDesc === needle || tt.name.toUpperCase().includes(needle);
  });
  if (byId) return byId;

  if (ticketTypeHint) {
    const hint = ticketTypeHint.trim().toLowerCase();
    return ticketTypes.find(
      (tt) =>
        tt.name.trim().toLowerCase() === hint ||
        tt.name.toLowerCase().includes(hint) ||
        hint.includes(tt.name.trim().toLowerCase())
    );
  }
  return undefined;
}

export function inferSeatsPerUnitFromName(name: string): number | null {
  const upper = name.toUpperCase();
  if (upper.includes('BISTRO') || /\bB\d+\b/.test(upper)) return 4;
  if (upper.includes('MIDDLE') || /\bM\d+\b/.test(upper)) return 6;
  if (upper.includes('PREMIUM') || /\bP\d+\b/.test(upper)) return 10;
  if (upper.includes('SUPERIOR') || /\bS\d+\b/.test(upper)) return 10;
  return null;
}

export function ticketQrCount(quantity: number, seatsPerUnit: number): number {
  const seats = Math.max(1, seatsPerUnit || 1);
  return Math.max(1, quantity) * seats;
}

export function buildSolsticePollySeatPlan(mapImageUrl: string) {
  const bUnits = Array.from({ length: 60 }, (_, i) => {
    const n = i + 1;
    return { id: `B${n}`, label: `B${n}`, ticketTypeHint: `B${n}` };
  });
  const pUnits = Array.from({ length: 7 }, (_, i) => {
    const n = i + 1;
    return { id: `P${n}`, label: `P${n}`, ticketTypeHint: `P${n}` };
  });
  const mUnits = [
    { id: 'M1', label: 'M1', ticketTypeHint: 'M1' },
    { id: 'M2', label: 'M2', ticketTypeHint: 'M2' }
  ];
  const sUnits = [
    { id: 'S1', label: 'S1', ticketTypeHint: 'S1' },
    { id: 'S2', label: 'S2', ticketTypeHint: 'S2' },
    { id: 'S3', label: 'S3', ticketTypeHint: 'S3' },
    { id: 'S4', label: 'S4', ticketTypeHint: 'S4' }
  ];

  return {
    layout: 'tables' as const,
    mapImageUrl,
    notes:
      'SOLSTICE x SHIMZA — Polly Türkbükü oturma planı. Her masa/loca tek satış birimi; PAX kadar QR üretilir.',
    zones: [
      {
        code: 'S',
        label: 'Superior (Sahne yanı)',
        seatsPerUnit: 10,
        color: '#c4a574',
        units: sUnits
      },
      {
        code: 'P',
        label: 'Premium',
        seatsPerUnit: 10,
        color: '#8b7355',
        units: pUnits
      },
      {
        code: 'M',
        label: 'Middle',
        seatsPerUnit: 6,
        color: '#6b8e23',
        units: mUnits
      },
      {
        code: 'B',
        label: 'Bistro',
        seatsPerUnit: 4,
        color: '#4a7c59',
        units: bUnits
      },
      {
        code: 'T',
        label: 'Dock / Iskele (Genel)',
        seatsPerUnit: 1,
        color: '#3d5a80',
        units: [{ id: 'T', label: 'T Category', ticketTypeHint: 'T CATEGORY' }]
      }
    ]
  };
}
