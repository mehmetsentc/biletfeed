import { ensureDbConnection, prisma } from '@/lib/db/prisma';
import type { SeatPlan, SeatPlanUnit, SeatPlanZone } from '@/lib/services/organizer-panel';
import { getSoldSeatUnitIds } from '@/lib/tickets/purchase-context';
import { matchTicketTypeToSeatUnit } from '@/lib/tickets/seat-packages';
import { extractSeatUnitId } from '@/lib/tickets/seat-label';

export type AvailableSeatOption = {
  id: string;
  label: string;
  zoneCode: string;
  zoneLabel: string;
};

export function asSeatPlan(raw: unknown): SeatPlan | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const plan = raw as SeatPlan;
  if (plan.layout !== 'sections' && plan.layout !== 'tables' && plan.layout !== 'general') {
    return null;
  }
  return plan;
}

export function requiresSeatAssignment(plan: SeatPlan | null): boolean {
  if (!plan) return false;
  if (plan.layout !== 'sections' && plan.layout !== 'tables') return false;
  return (plan.zones ?? []).some((z) => (z.units?.length ?? 0) > 0);
}

export function listSeatUnits(plan: SeatPlan): Array<{
  unit: SeatPlanUnit;
  zone: SeatPlanZone;
}> {
  const out: Array<{ unit: SeatPlanUnit; zone: SeatPlanZone }> = [];
  for (const zone of plan.zones ?? []) {
    for (const unit of zone.units ?? []) {
      out.push({ unit, zone });
    }
  }
  return out;
}

export async function getEventSeatPlanForOrganizer(
  eventId: string,
  organizerId: string
): Promise<SeatPlan | null> {
  await ensureDbConnection();
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    select: { venue: { select: { seatPlan: true } } }
  });
  return asSeatPlan(event?.venue?.seatPlan);
}

export async function listAvailableSeatsForTicketType(params: {
  eventId: string;
  ticketType: { id: string; name: string; description?: string | null };
  seatPlan: SeatPlan;
  soldSeatIds?: string[];
}): Promise<AvailableSeatOption[]> {
  const sold =
    params.soldSeatIds ?? (await getSoldSeatUnitIds(params.eventId));
  const soldSet = new Set(sold.map((id) => id.toUpperCase()));

  const options: AvailableSeatOption[] = [];
  for (const { unit, zone } of listSeatUnits(params.seatPlan)) {
    if (soldSet.has(unit.id.toUpperCase())) continue;
    const matched = matchTicketTypeToSeatUnit(
      unit.id,
      unit.ticketTypeHint,
      [params.ticketType]
    );
    if (!matched) continue;
    options.push({
      id: unit.id,
      label: unit.label,
      zoneCode: zone.code,
      zoneLabel: zone.label
    });
  }

  return options.sort((a, b) =>
    `${a.zoneLabel}-${a.label}`.localeCompare(`${b.zoneLabel}-${b.label}`, 'tr')
  );
}

/** Davetiye / checkout: koltuk planında mı ve satılmış mı */
export async function assertSeatAvailableForEvent(params: {
  eventId: string;
  seatUnitId: string;
  ticketType: { id: string; name: string; description?: string | null };
  seatPlan: SeatPlan;
}): Promise<string> {
  const seatId = params.seatUnitId.trim().toUpperCase();
  if (!seatId) throw new Error('Koltuk seçilmedi');

  const found = listSeatUnits(params.seatPlan).find(
    (x) => x.unit.id.toUpperCase() === seatId
  );
  if (!found) throw new Error('Seçilen koltuk bu etkinlikte yok');

  const matched = matchTicketTypeToSeatUnit(
    found.unit.id,
    found.unit.ticketTypeHint,
    [params.ticketType]
  );
  if (!matched) {
    throw new Error('Koltuk seçilen bilet türü ile uyuşmuyor');
  }

  const sold = await getSoldSeatUnitIds(params.eventId);
  if (sold.some((id) => id.toUpperCase() === seatId)) {
    throw new Error(`Koltuk ${found.unit.label} satılmış / rezerve`);
  }

  // Transaction içinde yarış: aynı koltukta VALID ticket var mı
  await ensureDbConnection();
  const conflict = await prisma.purchasedTicket.findMany({
    where: {
      eventId: params.eventId,
      status: { in: ['VALID', 'USED'] },
      deletedAt: null,
      OR: [
        { seatUnitId: { equals: found.unit.id, mode: 'insensitive' } },
        { attendeeName: { contains: found.unit.id } }
      ]
    },
    select: { seatUnitId: true, attendeeName: true },
    take: 20
  });
  for (const row of conflict) {
    const id = extractSeatUnitId({
      seatUnitId: row.seatUnitId,
      attendeeName: row.attendeeName
    });
    if (id === seatId) {
      throw new Error(`Koltuk ${found.unit.label} satılmış / rezerve`);
    }
  }

  return found.unit.id;
}
