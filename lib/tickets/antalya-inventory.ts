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

/** FİYAT sayfası stokları (GENEL renk sayımları ile birebir). */
export const ANTALYA_STOCK: Record<Exclude<SeatCategoryCode, 'DAVETIYE'>, number> = {
  VIP: 203,
  K1: 748,
  K2: 622,
  K3: 627,
  K4: 449,
  K5: 456
};

function seatLabel(row: string, n: number): string {
  if (row.startsWith('VIP ')) return `${row.slice(4)}${n}`;
  return `${row}${n}`;
}

export function buildAntyaSeatPlan(mapImageUrl?: string): SeatPlan {
  const zones: SeatPlanZone[] = (
    ['VIP', 'K1', 'K2', 'K3', 'K4', 'K5'] as const
  ).map((code) => {
    const meta = ANTALYA_CATEGORIES[code]!;
    const units = getAntyaInventorySeats()
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
      { name: 'VIP (A–H)', capacity: ANTALYA_STOCK.VIP },
      { name: 'Parter A–M', capacity: 1253 },
      { name: 'Parter N–Z7', capacity: 1748 }
    ],
    zones,
    mapImageUrl,
    notes: `Antalya Açıkhava — Biletix GENEL (${total} satılabilir). VIP 4500 · K1 3500 · K2 3000 · K3 2500 · K4 2000 · K5 1500. Salon davetiyesi satış dışı.`
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
  return getAntyaInventorySeats().find((s) => s.id.toUpperCase() === needle);
}
