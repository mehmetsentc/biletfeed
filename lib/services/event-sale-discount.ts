import type { Event, TicketType } from '@prisma/client';
import { ensureDbConnection, prisma } from '@/lib/db/prisma';

export type SaleDiscountFields = Pick<
  Event,
  | 'saleDiscountPercent'
  | 'saleDiscountTicketTypeIds'
  | 'saleDiscountActive'
  | 'saleDiscountEndsAt'
  | 'isFree'
>;

export type EffectivePrice = {
  listPrice: number;
  unitPrice: number;
  discountPercent: number | null;
  isOnSale: boolean;
};

export function isSaleDiscountLive(event: SaleDiscountFields, now = new Date()): boolean {
  if (event.isFree) return false;
  if (!event.saleDiscountActive) return false;
  const pct = event.saleDiscountPercent;
  if (pct == null || pct < 1 || pct > 100) return false;
  if (event.saleDiscountEndsAt && event.saleDiscountEndsAt.getTime() <= now.getTime()) {
    return false;
  }
  return true;
}

export function ticketTypeHasSaleDiscount(
  event: SaleDiscountFields,
  ticketTypeId: string
): boolean {
  if (!isSaleDiscountLive(event)) return false;
  const ids = event.saleDiscountTicketTypeIds ?? [];
  if (ids.length === 0) return true;
  return ids.includes(ticketTypeId);
}

export function effectiveTicketPrice(
  event: SaleDiscountFields,
  ticket: Pick<TicketType, 'id' | 'price'>
): EffectivePrice {
  const listPrice = Math.max(0, ticket.price);
  if (!ticketTypeHasSaleDiscount(event, ticket.id)) {
    return {
      listPrice,
      unitPrice: listPrice,
      discountPercent: null,
      isOnSale: false
    };
  }
  const pct = event.saleDiscountPercent!;
  const unitPrice =
    Math.round(listPrice * (1 - pct / 100) * 100) / 100;
  return {
    listPrice,
    unitPrice,
    discountPercent: pct,
    isOnSale: unitPrice < listPrice
  };
}

export async function setEventSaleDiscount(params: {
  eventId: string;
  organizerId?: string;
  percent: number | null;
  ticketTypeIds?: string[];
  active: boolean;
  endsAt?: Date | null;
}): Promise<Event> {
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: {
      id: params.eventId,
      deletedAt: null,
      ...(params.organizerId ? { organizerId: params.organizerId } : {})
    },
    include: { ticketTypes: { where: { deletedAt: null }, select: { id: true } } }
  });
  if (!event) throw new Error('Etkinlik bulunamadı');

  if (params.active) {
    if (params.percent == null || params.percent < 1 || params.percent > 100) {
      throw new Error('İndirim oranı 1–100 arasında olmalı');
    }
  }

  const allowed = new Set(event.ticketTypes.map((t) => t.id));
  const ticketTypeIds = (params.ticketTypeIds ?? []).filter((id) => allowed.has(id));

  return prisma.event.update({
    where: { id: event.id },
    data: {
      saleDiscountPercent: params.active ? params.percent : params.percent,
      saleDiscountTicketTypeIds: ticketTypeIds,
      saleDiscountActive: params.active,
      saleDiscountEndsAt: params.endsAt === undefined ? undefined : params.endsAt,
      // Listing badge ile hizala
      discountPercent: params.active ? params.percent : null
    }
  });
}
