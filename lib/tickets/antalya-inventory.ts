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

/** Public satışa açık tahsis (ücretli kategoriler) */
export const GIPSY_KINGS_ALLOCATION = [
  { row: 'E', from: 1, to: 10, cat: 'K4' as const }, // Parter 1 · Cat 4
  { row: 'E', from: 11, to: 20, cat: 'K1' as const }, // Parter 1 · Cat 1
  { row: 'N', from: 16, to: 25, cat: 'K2' as const }, // Parter 4 · Cat 2
  { row: 'V', from: 1, to: 10, cat: 'K3' as const }, // Parter 4 · Cat 3
  { row: 'Z', from: 1, to: 10, cat: 'K5' as const }, // Parter 4 · Cat 5
  { row: 'VIP E', from: 1, to: 10, cat: 'VIP' as const } // VIP · VIP (şu an paused)
] as const;

/**
 * Organizatör davetiye — yalnızca davetiye paneli (public haritada yok).
 * Yeşil VIP + Parter 2 · A 25–48 + Parter 1/3/4/6 (M/O/R/U)
 * + Parter 4/6 · 5. Kategori (P/S/T/Z2/Z5/Z1 — Ercan listesi).
 */
export const GIPSY_KINGS_INVITE_ALLOCATION = [
  { row: 'VIP B', from: 9, to: 17 },
  { row: 'VIP C', from: 1, to: 14 },
  { row: 'VIP C', from: 22, to: 27 },
  { row: 'VIP D', from: 1, to: 32 },
  { row: 'A', from: 25, to: 48 },
  // Parter 1
  { row: 'M', from: 1, to: 10 },
  // Parter 3
  { row: 'M', from: 106, to: 115 },
  // Parter 4 (önceki davetiye)
  { row: 'O', from: 3, to: 13 },
  { row: 'R', from: 1, to: 13 },
  { row: 'U', from: 1, to: 15 },
  // Parter 6 (önceki davetiye)
  { row: 'O', from: 108, to: 117 },
  { row: 'R', from: 120, to: 134 },
  { row: 'U', from: 130, to: 144 },
  // Parter 4 · 5. Kategori (davetiye)
  { row: 'P', from: 3, to: 8 },
  { row: 'S', from: 1, to: 12 },
  { row: 'T', from: 1, to: 13 },
  { row: 'Z2', from: 1, to: 4 },
  { row: 'Z2', from: 6, to: 6 },
  { row: 'Z5', from: 1, to: 9 },
  // Parter 6 · 5. Kategori (davetiye)
  { row: 'P', from: 113, to: 117 },
  { row: 'S', from: 124, to: 138 },
  { row: 'T', from: 127, to: 141 },
  { row: 'Z1', from: 91, to: 109 }
] as const;

export const ORGANIZER_INVITE_TICKET_NAME = 'Organizator Davetiye';

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

function seatsFromBlocks(
  blocks: ReadonlyArray<{ row: string; from: number; to: number; cat?: SeatCategoryCode }>
): InventorySeat[] {
  const byRow = new Map(getAntyaRows().map((r) => [r.row, r.seats]));
  const out: InventorySeat[] = [];
  for (const block of blocks) {
    const seats = byRow.get(block.row) ?? [];
    for (const s of seats) {
      if (s.n < block.from || s.n > block.to) continue;
      out.push({
        id: s.id,
        row: block.row,
        n: s.n,
        cat: block.cat ?? 'DAVETIYE'
      });
    }
  }
  return out;
}

/** Organizer-allocated public sellable seats only. */
export function getAllocatedInventorySeats(): InventorySeat[] {
  return seatsFromBlocks(
    GIPSY_KINGS_ALLOCATION.map((b) => ({
      row: b.row,
      from: b.from,
      to: b.to,
      cat: b.cat
    }))
  );
}

/** Davetiye-only seats — public satış/harita dışı. */
export function getInviteInventorySeats(): InventorySeat[] {
  const raw = seatsFromBlocks(
    GIPSY_KINGS_INVITE_ALLOCATION.map((b) => ({
      row: b.row,
      from: b.from,
      to: b.to,
      cat: 'DAVETIYE' as const
    }))
  );
  const seen = new Set<string>();
  const out: InventorySeat[] = [];
  for (const s of raw) {
    const key = s.id.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
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

const inviteIdSet = (() => {
  const set = new Set<string>();
  for (const s of getInviteInventorySeats()) {
    set.add(s.id.toUpperCase());
  }
  return set;
})();

export function isAllocatedSeatId(unitId: string): boolean {
  return allocatedIdSet.has(unitId.toUpperCase());
}

export function isInviteSeatId(unitId: string): boolean {
  return inviteIdSet.has(unitId.toUpperCase());
}

/** Organizer allocation stocks — 10 per public category. */
export const ANTALYA_STOCK: Record<Exclude<SeatCategoryCode, 'DAVETIYE'>, number> = {
  VIP: 10,
  K1: 10,
  K2: 10,
  K3: 10,
  K4: 10,
  K5: 10
};

export const INVITE_STOCK = getInviteInventorySeats().length;

function seatLabel(row: string, n: number): string {
  if (row.startsWith('VIP ')) return `${row.slice(4)}${n}`;
  return `${row}${n}`;
}

export function buildAntyaSeatPlan(mapImageUrl?: string): SeatPlan {
  const allocated = getAllocatedInventorySeats();
  const inviteSeats = getInviteInventorySeats();

  const publicZones: SeatPlanZone[] = (
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

  const inviteZone: SeatPlanZone = {
    code: 'DAVETIYE',
    label: ORGANIZER_INVITE_TICKET_NAME,
    seatsPerUnit: 1,
    color: '#2e7d32',
    units: inviteSeats.map((s) => ({
      id: s.id,
      label: seatLabel(s.row, s.n),
      ticketTypeHint: ORGANIZER_INVITE_TICKET_NAME
    }))
  };

  const zones = [...publicZones, inviteZone];
  const totalPublic = publicZones.reduce((n, z) => n + z.units.length, 0);
  const totalInvite = inviteZone.units.length;

  return {
    layout: 'sections',
    sections: [
      { name: 'VIP E (1–10)', capacity: ANTALYA_STOCK.VIP },
      { name: 'Parter 1 · E (1–20)', capacity: ANTALYA_STOCK.K4 + ANTALYA_STOCK.K1 },
      {
        name: 'Parter 4 · N/V/Z',
        capacity: ANTALYA_STOCK.K2 + ANTALYA_STOCK.K3 + ANTALYA_STOCK.K5
      },
      {
        name: 'Organizator Davetiye (yeşil VIP + A 25–48 + Parter 1/3/4/6 + P/S/T/Z)',
        capacity: totalInvite
      }
    ],
    zones,
    mapImageUrl,
    notes: `Gipsy Kings — satış ${totalPublic} koltuk; davetiye ${totalInvite} koltuk. Davetiye koltukları public harita/satışta değil; yalnızca organizatör davetiyesinde yer numarası.`
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
  return (
    getAllocatedInventorySeats().find((s) => s.id.toUpperCase() === needle) ??
    getInviteInventorySeats().find((s) => s.id.toUpperCase() === needle)
  );
}
