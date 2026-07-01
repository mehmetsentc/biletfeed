import type { TicketTypeEnum } from '@prisma/client';

/** Loca / VIP loca — bilet satış istatistiklerinde ayrı kategori */
export function isLocaTicketType(type: TicketTypeEnum | string, name: string): boolean {
  const n = name.toLowerCase();
  if (
    n.includes('loca') ||
    n.includes('loge') ||
    n.includes('lodge') ||
    n.includes('box') ||
    n.includes('skybox')
  ) {
    return true;
  }
  return type === 'vip' || type === 'backstage';
}

export type SalesCategoryFilter = 'ticket' | 'loca' | 'all';

export function matchesSalesCategory(
  type: TicketTypeEnum | string,
  name: string,
  filter: SalesCategoryFilter
): boolean {
  if (filter === 'all') return true;
  const loca = isLocaTicketType(type, name);
  return filter === 'loca' ? loca : !loca;
}
