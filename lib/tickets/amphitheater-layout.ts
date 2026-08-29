/**
 * Antalya Açıkhava amfi geometrisi — Excel GENEL satır/koltuk envanterinden.
 * Sahne üstte; VIP → A–M → N–Z7 sırasıyla açılır.
 */

import { getAntyaRows, isAllocatedSeatId } from '@/lib/tickets/antalya-inventory';

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

  // halfSpan ≤ ~0.48π and radius ≤ (cx-pad)/sin(halfSpanMax) keep every
  // seat inside the viewBox below the stage. Wider arcs (old 0.78π × r≈780)
  // put Parter 4 V/Z seats 1–10 at y<0 — K3/K5 invisible on the map.
  const pad = 18;
  const halfSpanMax = Math.PI * 0.48;
  const radiusMax = (cx - pad) / Math.sin(halfSpanMax) - 4;

  ROW_ORDER.forEach((rowLabel, ri) => {
    const seats = byRow.get(rowLabel);
    if (!seats?.length) return;

    const t = totalRows === 1 ? 0 : ri / (totalRows - 1);
    const radius = lerp(88, radiusMax, t);
    const isVip = rowLabel.startsWith('VIP');
    // VIP daha dar yay; arka sıralar daha geniş (viewBox içinde)
    const halfSpan =
      lerp(0.22, 0.48, t) * Math.PI * (isVip ? 0.55 : 1);
    const a0 = Math.PI / 2 - halfSpan;
    const a1 = Math.PI / 2 + halfSpan;
    const rDot = lerp(5.2, 2.6, t);

    const sorted = [...seats].sort((a, b) => a.n - b.n);
    const maxN = sorted[sorted.length - 1]!.n;
    const minN = sorted[0]!.n;
    // Satışa açık koltuklar yayın ortasına çekilir (Z 1–10 gibi uçta kaybolmasın)
    const allocated = sorted.filter((s) => isAllocatedSeatId(s.id));

    for (const s of sorted) {
      let u: number;
      if (allocated.length > 0 && isAllocatedSeatId(s.id)) {
        const idx = allocated.findIndex((a) => a.id === s.id);
        const at =
          allocated.length === 1 ? 0.5 : idx / (allocated.length - 1);
        // Ortadaki %50 bant — default kamerada görünür
        u = 0.25 + at * 0.5;
      } else {
        u = maxN === minN ? 0.5 : (s.n - minN) / (maxN - minN);
      }
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
