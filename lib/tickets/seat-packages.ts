/** Masa/loca paket bileti yardımcıları */

const UNIT_CODE_RE = /\b([SBMPT])\s*[-.]?\s*(\d+)\b/i;

export function parseSeatUnitCode(name: string): string | null {
  const match = name.match(UNIT_CODE_RE);
  if (!match) return null;
  return `${match[1]!.toUpperCase()}${match[2]}`;
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
