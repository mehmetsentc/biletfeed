import seatsJson from '@/lib/tickets/data/antalya-acikhava-seats.json';
import type { SeatPlan, SeatPlanZone } from '@/lib/services/organizer-panel';

export type SeatCategoryCode = 'VIP' | 'K1' | 'K2' | 'K3' | 'K4' | 'K5' | 'DAVETIYE';

export type InventorySeat = {
  id: string;
  row: string;
  n: number;
  cat: SeatCategoryCode;
};

export type InventoryCategory = {
  label: string;
  price: number;
  color: string;
  sellable: boolean;
};

type SeatsFile = {
  venue: string;
  source: string;
  categories: Record<string, InventoryCategory>;
  rows: Array<{ row: string; seats: Array<{ n: number; cat: string; id: string }> }>;
};

const data = seatsJson as SeatsFile;

export const ANTALYA_CATEGORIES = data.categories;

/**
 * Gipsy Kings — organizatör tahsisi (60 koltuk).
 * Tam amfi haritası context için çizilir; yalnızca bunlar satılabilir.
 */
export const GIPSY_KINGS_ALLOCATION = [
  { row: 'E', from: 1, to: 10, cat: 'K4' as const }, // Parter 1 · Cat 4
  { row: 'E', from: 11, to: 20, cat: 'K1' as const }, // Parter 1 · Cat 1
  { row: 'N', from: 16, to: 25, cat: 'K2' as const }, // Parter 4 · Cat 2
  { row: 'V', from: 1, to: 10, cat: 'K3' as const }, // Parter 4 · Cat 3
  { row: 'Z', from: 1, to: 10, cat: 'K5' as const }, // Parter 4 · Cat 5
  { row: 'VIP E', from: 1, to: 10, cat: 'VIP' as const } // VIP · VIP
] as const;

export function getAntyaInventorySeats(): InventorySeat[] {
  const out: InventorySeat[] = [];
  for (const row of data.rows) {
    for (const s of row.seats) {
      out.push({
        id: s.id,
        row: row.row,
        n: s.n,
        cat: s.cat as SeatCategoryCode
      });
    }
  }
  return out;
}

export function getAntyaRows(): Array<{ row: string; seats: InventorySeat[] }> {
  return data.rows.map((r) => ({
    row: r.row,
    seats: r.seats.map((s) => ({
      id: s.id,
      row: r.row,
      n: s.n,
      cat: s.cat as SeatCategoryCode
    }))
  }));
}

/** Organizer-allocated sellable seats only (60). Category from allocation, not Excel. */
export function getAllocatedInventorySeats(): InventorySeat[] {
  const byRow = new Map(getAntyaRows().map((r) => [r.row, r.seats]));
  const out: InventorySeat[] = [];

  for (const block of GIPSY_KINGS_ALLOCATION) {
    const seats = byRow.get(block.row) ?? [];
    for (const s of seats) {
      if (s.n < block.from || s.n > block.to) continue;
      out.push({
        id: s.id,
        row: block.row,
        n: s.n,
        cat: block.cat
      });
    }
  }

  return out;
}

const allocatedIdSet = (() => {
  const set = new Set<string>();
  for (const s of getAllocatedInventorySeats()) {
    set.add(s.id.toUpperCase());
  }
  return set;
})();

export function isAllocatedSeatId(unitId: string): boolean {
  return allocatedIdSet.has(unitId.toUpperCase());
}

/** Organizer allocation stocks — 10 per category (60 total). */
export const ANTALYA_STOCK: Record<Exclude<SeatCategoryCode, 'DAVETIYE'>, number> = {
  VIP: 10,
  K1: 10,
  K2: 10,
  K3: 10,
  K4: 10,
  K5: 10
};

function seatLabel(row: string, n: number): string {
  if (row.startsWith('VIP ')) return `${row.slice(4)}${n}`;
  return `${row}${n}`;
}

export function buildAntyaSeatPlan(mapImageUrl?: string): SeatPlan {
  const allocated = getAllocatedInventorySeats();
  const zones: SeatPlanZone[] = (
    ['VIP', 'K1', 'K2', 'K3', 'K4', 'K5'] as const
  ).map((code) => {
    const meta = ANTALYA_CATEGORIES[code]!;
    const units = allocated
      .filter((s) => s.cat === code)
      .map((s) => ({
        id: s.id,
        label: seatLabel(s.row, s.n),
        ticketTypeHint: meta.label
      }));

    return {
      code,
      label: meta.label,
      seatsPerUnit: 1,
      color: meta.color,
      units
    };
  });

  const total = zones.reduce((n, z) => n + z.units.length, 0);

  return {
    layout: 'sections',
    sections: [
      { name: 'VIP E (1–10)', capacity: ANTALYA_STOCK.VIP },
      { name: 'Parter 1 · E (1–20)', capacity: ANTALYA_STOCK.K4 + ANTALYA_STOCK.K1 },
      {
        name: 'Parter 4 · N/V/Z',
        capacity: ANTALYA_STOCK.K2 + ANTALYA_STOCK.K3 + ANTALYA_STOCK.K5
      }
    ],
    zones,
    mapImageUrl,
    notes: `Gipsy Kings — organizatör tahsisi (${total} koltuk). VIP 4500 · K1 3500 · K2 3000 · K3 2500 · K4 2000 · K5 1500. Haritada diğer koltuklar satılamaz.`
  };
}

export function categoryTicketDefs() {
  return (['VIP', 'K1', 'K2', 'K3', 'K4', 'K5'] as const).map((code) => {
    const meta = ANTALYA_CATEGORIES[code]!;
    return {
      code,
      name: meta.label,
      description: `Antalya Açıkhava · ${meta.label}`,
      price: meta.price,
      capacity: ANTALYA_STOCK[code],
      type: code === 'VIP' ? ('vip' as const) : ('general' as const),
      color: meta.color
    };
  });
}

export function findInventorySeat(unitId: string): InventorySeat | undefined {
  const needle = unitId.toUpperCase();
  return getAllocatedInventorySeats().find((s) => s.id.toUpperCase() === needle);
}
