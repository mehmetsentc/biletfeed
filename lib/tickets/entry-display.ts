import type { TicketTypeEnum } from '@prisma/client';
import { isLocaTicketType } from '@/lib/services/ticket-type-category';

export type EntryTicketKind = 'bilet' | 'davetiye';
export type EntryCategory = 'genel' | 'bistro' | 'loca' | 'diger';

/** Bilet türü adından kısa etiket (ör. "Genel Giriş — ayakta" → "Genel Giriş") */
export function ticketTypeDisplayLabel(name: string): string {
  const sep = ' — ';
  const idx = name.indexOf(sep);
  return idx >= 0 ? name.slice(0, idx).trim() : name.trim();
}

export function resolveEntryCategory(
  type: TicketTypeEnum | string,
  name: string
): EntryCategory {
  const label = ticketTypeDisplayLabel(name).toLowerCase();
  const n = name.toLowerCase();

  if (n.includes('bistro') || label.includes('bistro')) return 'bistro';

  if (
    n.includes('loca') ||
    n.includes('loge') ||
    n.includes('lodge') ||
    n.includes('loja') ||
    label.includes('loca') ||
    label.includes('loge') ||
    label.includes('loja')
  ) {
    return 'loca';
  }

  if (type === 'general' || label.includes('genel')) return 'genel';

  if (isLocaTicketType(type, name)) return 'loca';

  return 'diger';
}

export function entryCategoryLabel(category: EntryCategory, ticketTypeName?: string): string {
  switch (category) {
    case 'genel':
      return 'Genel';
    case 'bistro':
      return 'Bistro';
    case 'loca':
      return 'Loğe';
    default:
      return ticketTypeName ? ticketTypeDisplayLabel(ticketTypeName) : 'Diğer';
  }
}

export function resolveTicketKind(isInvitation: boolean): EntryTicketKind {
  return isInvitation ? 'davetiye' : 'bilet';
}

export function entryTicketKindLabel(kind: EntryTicketKind): string {
  return kind === 'davetiye' ? 'Davetiye' : 'Bilet';
}

export function checkInResultLabel(result: string): string {
  switch (result) {
    case 'VALID':
      return 'Giriş OK';
    case 'USED':
      return 'Kullanılmış';
    case 'REFUNDED':
      return 'İade';
    case 'CANCELLED':
      return 'İptal';
    case 'EXPIRED':
      return 'Süresi doldu';
    case 'INVALID':
      return 'Geçersiz';
    default:
      return result;
  }
}

export function entryCategoryBadgeClass(category: EntryCategory): string {
  switch (category) {
    case 'genel':
      return 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30';
    case 'bistro':
      return 'bg-violet-500/15 text-violet-400 ring-violet-500/30';
    case 'loca':
      return 'bg-amber-500/15 text-amber-400 ring-amber-500/30';
    default:
      return 'bg-white/10 text-white/70 ring-white/20';
  }
}

export function entryKindBadgeClass(kind: EntryTicketKind): string {
  return kind === 'davetiye'
    ? 'bg-primary/15 text-primary ring-primary/30'
    : 'bg-sky-500/15 text-sky-400 ring-sky-500/30';
}
