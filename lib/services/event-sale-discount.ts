import type { Event, TicketType } from '@prisma/client';
import { ensureDbConnection, prisma } from '@/lib/db/prisma';

export type SaleCampaignType = 'percent' | 'bogo';

export type SaleDiscountFields = Pick<
  Event,
  | 'saleDiscountPercent'
  | 'saleDiscountTicketTypeIds'
  | 'saleDiscountActive'
  | 'saleDiscountEndsAt'
  | 'isFree'
> & {
  saleCampaignType?: string | null;
};

export type EffectivePrice = {
  listPrice: number;
  unitPrice: number;
  discountPercent: number | null;
  isOnSale: boolean;
  isBogo: boolean;
};

/** 1 alana 1 bedava: ücretli adet = ceil(qty/2) */
export function bogoPaidQuantity(quantity: number): number {
  const qty = Math.max(0, Math.floor(quantity));
  if (qty <= 0) return 0;
  return Math.ceil(qty / 2);
}

export function normalizeSaleCampaignType(
  value: string | null | undefined
): SaleCampaignType {
  return value === 'bogo' ? 'bogo' : 'percent';
}

function readCampaignType(event: SaleDiscountFields): SaleCampaignType {
  return normalizeSaleCampaignType(
    event.saleCampaignType ??
      (event as { sale_campaign_type?: string }).sale_campaign_type
  );
}

function campaignEndsInFuture(
  event: SaleDiscountFields,
  now: Date
): boolean {
  if (!event.saleDiscountEndsAt) return true;
  return event.saleDiscountEndsAt.getTime() > now.getTime();
}

export function isSaleCampaignLive(
  event: SaleDiscountFields,
  now = new Date()
): boolean {
  if (event.isFree) return false;
  if (!event.saleDiscountActive) return false;
  if (!campaignEndsInFuture(event, now)) return false;
  const type = readCampaignType(event);
  if (type === 'bogo') return true;
  const pct = event.saleDiscountPercent;
  return pct != null && pct >= 1 && pct <= 100;
}

/** @deprecated — isSaleCampaignLive kullanın */
export function isSaleDiscountLive(
  event: SaleDiscountFields,
  now = new Date()
): boolean {
  return isSaleCampaignLive(event, now);
}

export function ticketTypeHasSaleCampaign(
  event: SaleDiscountFields,
  ticketTypeId: string
): boolean {
  if (!isSaleCampaignLive(event)) return false;
  const ids = event.saleDiscountTicketTypeIds ?? [];
  if (ids.length === 0) return true;
  return ids.includes(ticketTypeId);
}

export function ticketTypeHasSaleDiscount(
  event: SaleDiscountFields,
  ticketTypeId: string
): boolean {
  return ticketTypeHasSaleCampaign(event, ticketTypeId);
}

export function effectiveTicketPrice(
  event: SaleDiscountFields,
  ticket: Pick<TicketType, 'id' | 'price'>
): EffectivePrice {
  const listPrice = Math.max(0, ticket.price);
  if (!ticketTypeHasSaleCampaign(event, ticket.id)) {
    return {
      listPrice,
      unitPrice: listPrice,
      discountPercent: null,
      isOnSale: false,
      isBogo: false
    };
  }

  const type = readCampaignType(event);
  if (type === 'bogo') {
    return {
      listPrice,
      unitPrice: listPrice,
      discountPercent: null,
      isOnSale: true,
      isBogo: true
    };
  }

  const pct = event.saleDiscountPercent!;
  const unitPrice = Math.round(listPrice * (1 - pct / 100) * 100) / 100;
  return {
    listPrice,
    unitPrice,
    discountPercent: pct,
    isOnSale: unitPrice < listPrice,
    isBogo: false
  };
}

/** Satır tutarı: BOGO’da yalnızca ücretli adet × birim fiyat */
export function lineSubtotalForQuantity(
  event: SaleDiscountFields,
  ticket: Pick<TicketType, 'id' | 'price'>,
  quantity: number
): number {
  const qty = Math.max(0, Math.floor(quantity));
  const eff = effectiveTicketPrice(event, ticket);
  if (eff.isBogo) {
    return Math.round(eff.unitPrice * bogoPaidQuantity(qty) * 100) / 100;
  }
  return Math.round(eff.unitPrice * qty * 100) / 100;
}

export async function setEventSaleDiscount(params: {
  eventId: string;
  organizerId?: string;
  campaignType?: SaleCampaignType;
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

  const campaignType = normalizeSaleCampaignType(
    params.campaignType ??
      (event as { saleCampaignType?: string }).saleCampaignType
  );

  if (params.active) {
    if (campaignType === 'percent') {
      if (params.percent == null || params.percent < 1 || params.percent > 100) {
        throw new Error('İndirim oranı 1–100 arasında olmalı');
      }
    }
  }

  const allowed = new Set(event.ticketTypes.map((t) => t.id));
  const ticketTypeIds = (params.ticketTypeIds ?? []).filter((id) => allowed.has(id));

  const percent =
    campaignType === 'bogo'
      ? null
      : params.active
        ? params.percent
        : params.percent;

  const updated = await prisma.event.update({
    where: { id: event.id },
    data: {
      saleDiscountPercent: percent,
      saleDiscountTicketTypeIds: ticketTypeIds,
      saleDiscountActive: params.active,
      saleDiscountEndsAt: params.endsAt === undefined ? undefined : params.endsAt,
      discountPercent:
        params.active && campaignType === 'percent' ? params.percent : null
    }
  });

  // Kolon migrate sonrası client regenerate’e kadar raw yazılır
  try {
    await prisma.$executeRaw`
      UPDATE events
      SET sale_campaign_type = ${campaignType}
      WHERE id = ${event.id}::uuid
    `;
  } catch (err) {
    console.error('[sale-discount] sale_campaign_type yazılamadı', err);
  }

  return { ...updated, saleCampaignType: campaignType } as Event & {
    saleCampaignType: string;
  };
}
