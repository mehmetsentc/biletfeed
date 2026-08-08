/**
 * Antalya Açıkhava amfi geometrisi — Excel GENEL satır/koltuk envanterinden.
 * Sahne üstte; VIP → A–M → N–Z7 sırasıyla açılır.
 */

import { getAntyaRows, type InventorySeat } from '@/lib/tickets/antalya-inventory';

export type AmphitheaterDot = {
  key: string;
  x: number;
  y: number;
  r: number;
  row: string;
  seat: number;
  unitId: string;
  cat: string;
};

export const AMPHITHEATER_VB = { w: 1200, h: 900, cx: 600, cy: 48 } as const;

const ROW_ORDER = [
  'VIP A',
  'VIP B',
  'VIP C',
  'VIP D',
  'VIP E',
  'VIP F',
  'VIP G',
  'VIP H',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'R',
  'S',
  'T',
  'U',
  'V',
  'Y',
  'Z',
  'Z1',
  'Z2',
  'Z3',
  'Z4',
  'Z5',
  'Z6',
  'Z7'
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function buildAmphitheaterDots(): AmphitheaterDot[] {
  const { cx, cy } = AMPHITHEATER_VB;
  const byRow = new Map(getAntyaRows().map((r) => [r.row, r.seats]));
  const dots: AmphitheaterDot[] = [];
  const totalRows = ROW_ORDER.length;

  ROW_ORDER.forEach((rowLabel, ri) => {
    const seats = byRow.get(rowLabel);
    if (!seats?.length) return;

    const t = totalRows === 1 ? 0 : ri / (totalRows - 1);
    const radius = lerp(88, 780, t);
    const isVip = rowLabel.startsWith('VIP');
    // VIP daha dar yay; arka sıralar daha geniş
    const halfSpan = lerp(0.22, 0.78, t) * Math.PI * (isVip ? 0.55 : 1);
    const a0 = Math.PI / 2 - halfSpan;
    const a1 = Math.PI / 2 + halfSpan;
    const rDot = lerp(5.2, 2.6, t);

    const sorted = [...seats].sort((a, b) => a.n - b.n);
    const maxN = sorted[sorted.length - 1]!.n;
    const minN = sorted[0]!.n;

    for (const s of sorted) {
      const u =
        maxN === minN ? 0.5 : (s.n - minN) / (maxN - minN);
      // Excel’de yüksek numara solda görünüyor — yayda tersle
      const angle = lerp(a1, a0, u);
      dots.push({
        key: s.id,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        r: rDot,
        row: rowLabel,
        seat: s.n,
        unitId: s.id,
        cat: s.cat
      });
    }
  });

  return dots;
}

export function stagePath(): string {
  const { cx } = AMPHITHEATER_VB;
  return `M ${cx - 240} 8 Q ${cx} 56 ${cx + 240} 8 L ${cx + 210} 30 Q ${cx} 74 ${cx - 210} 30 Z`;
}

export function boothRect() {
  return { x: 555, y: 455, w: 90, h: 34 };
}

export type { InventorySeat };
