/**
 * Antalya Açıkhava tarzı amfi geometrisi (bubilet kroki referansı).
 * Sahne üstte; ön: P3 | VIP | P1; arka: P6 | P5 | P4.
 * Satılık envanter: VIP / P1 / P4 unit id’leri; diğer noktalar dolu (gri).
 */

export type AmphitheaterDot = {
  key: string;
  x: number;
  y: number;
  r: number;
  section: string;
  row: string;
  seat: number;
  /** Envanter unit id — örn. P1-E11, VIP-E3, P4-N16; filler için null */
  unitId: string | null;
};

export const AMPHITHEATER_VB = { w: 1000, h: 720, cx: 500, cy: 40 } as const;

type Wedge = {
  section: string;
  prefix: string;
  sellable: boolean;
  a0: number;
  a1: number;
  rows: string[];
  /** radius start/end for this wedge’s rows */
  r0: number;
  r1: number;
  seatsForRow: (rowIndex: number) => number;
};

const FRONT_ROWS = 'ABCDEFGHIJKLM'.split('');
const VIP_ROWS = 'ABCDEFGH'.split('');
const REAR_ROWS = 'NOPQRSTUVWXYZ'.split('');

const WEDGES: Wedge[] = [
  {
    section: 'Parter 3',
    prefix: 'P3',
    sellable: false,
    a0: 0.2 * Math.PI,
    a1: 0.38 * Math.PI,
    rows: FRONT_ROWS,
    r0: 100,
    r1: 275,
    seatsForRow: (i) => 11 + Math.floor(i * 0.4)
  },
  {
    section: 'VIP',
    prefix: 'VIP',
    sellable: true,
    a0: 0.4 * Math.PI,
    a1: 0.6 * Math.PI,
    rows: VIP_ROWS,
    r0: 95,
    r1: 210,
    seatsForRow: () => 14
  },
  {
    section: 'Parter 2',
    prefix: 'P2',
    sellable: false,
    a0: 0.4 * Math.PI,
    a1: 0.6 * Math.PI,
    rows: 'IJKLM'.split(''),
    r0: 225,
    r1: 275,
    seatsForRow: (i) => 16 + i
  },
  {
    section: 'Parter 1',
    prefix: 'P1',
    sellable: true,
    a0: 0.62 * Math.PI,
    a1: 0.8 * Math.PI,
    rows: FRONT_ROWS,
    r0: 100,
    r1: 275,
    seatsForRow: (i) => 22 + Math.floor(i * 0.3) // E satırı ≥ 20
  },
  {
    section: 'Parter 6',
    prefix: 'P6',
    sellable: false,
    a0: 0.18 * Math.PI,
    a1: 0.4 * Math.PI,
    rows: REAR_ROWS,
    r0: 300,
    r1: 530,
    seatsForRow: (i) => 14 + Math.floor(i * 0.5)
  },
  {
    section: 'Parter 5',
    prefix: 'P5',
    sellable: false,
    a0: 0.42 * Math.PI,
    a1: 0.58 * Math.PI,
    rows: REAR_ROWS,
    r0: 300,
    r1: 530,
    seatsForRow: (i) => 16 + Math.floor(i * 0.55)
  },
  {
    section: 'Parter 4',
    prefix: 'P4',
    sellable: true,
    a0: 0.6 * Math.PI,
    a1: 0.82 * Math.PI,
    rows: REAR_ROWS,
    r0: 300,
    r1: 530,
    seatsForRow: (i) => 28 + Math.floor(i * 0.4) // N satırı ≥ 25
  }
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function buildAmphitheaterDots(): AmphitheaterDot[] {
  const { cx, cy } = AMPHITHEATER_VB;
  const dots: AmphitheaterDot[] = [];

  for (const w of WEDGES) {
    const n = w.rows.length;
    w.rows.forEach((row, ri) => {
      const t = n === 1 ? 0 : ri / (n - 1);
      const radius = lerp(w.r0, w.r1, t);
      const seatCount = w.seatsForRow(ri);
      const rDot = w.r0 < 280 ? 4.1 : 3.6;

      for (let s = 1; s <= seatCount; s++) {
        const u = seatCount === 1 ? 0.5 : (s - 1) / (seatCount - 1);
        const angle = lerp(w.a0, w.a1, u);
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        const unitId = w.sellable ? `${w.prefix}-${row}${s}` : null;

        dots.push({
          key: `${w.prefix}-${row}${s}`,
          x,
          y,
          r: rDot,
          section: w.section,
          row,
          seat: s,
          unitId
        });
      }
    });
  }

  return dots;
}

export function stagePath(): string {
  const { cx } = AMPHITHEATER_VB;
  return `M ${cx - 200} 6 Q ${cx} 48 ${cx + 200} 6 L ${cx + 178} 26 Q ${cx} 64 ${cx - 178} 26 Z`;
}

/** Teknik kabin (referans krokideki gri kutu) */
export function boothRect() {
  return { x: 455, y: 395, w: 90, h: 36 };
}
