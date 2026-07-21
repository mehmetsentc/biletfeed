import type { TicketTypeEnum } from '@prisma/client';
import { ticketTypeDisplayLabel } from '@/lib/tickets/entry-display';

function normalizeName(name: string): string {
  return ticketTypeDisplayLabel(name).toLowerCase();
}

/** Loca / loğe — yalnızca isme göre (enum `vip` artık otomatik loca sayılmaz) */
export function isLocaTicketType(_type: TicketTypeEnum | string, name: string): boolean {
  const n = normalizeName(name);
  return (
    n.includes('loca') ||
    n.includes('loge') ||
    n.includes('löge') ||
    n.includes('loğe') ||
    n.includes('lodge') ||
    n.includes('loja') ||
    n.includes('skybox')
  );
}

/** Organizatörün verdiği kategori adından Prisma enum çıkarır */
export function inferTicketTypeEnum(name: string): TicketTypeEnum {
  const n = normalizeName(name);

  if (n.includes('davetiye') || n.includes('invitation') || n.includes('invite')) {
    return 'invitation';
  }
  if (n.includes('backstage') || n.includes('sahne arkasi') || n.includes('sahne arkası')) {
    return 'backstage';
  }
  if (n.includes('öğrenci') || n.includes('ogrenci') || n.includes('student')) {
    return 'student';
  }
  if (n.includes('erken kuş') || n.includes('erken kus') || n.includes('early bird') || n.includes('earlybird')) {
    return 'early_bird';
  }
  if (n.includes('media') || n.includes('basın') || n.includes('basin') || n.includes('press')) {
    return 'media';
  }
  if (n.includes('staff') || n.includes('personel') || n.includes('ekip')) {
    return 'staff';
  }
  if (n.includes('sponsor')) {
    return 'sponsor';
  }
  if (isLocaTicketType('general', name) || /\bvip\b/.test(n) || n.includes('vip ')) {
    return 'vip';
  }
  return 'general';
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
