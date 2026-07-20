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

/** Açık + koyu temada WCAG AA kontrastlı rozet sınıfları */
export function entryCategoryBadgeClass(category: EntryCategory): string {
  switch (category) {
    case 'genel':
      return 'bg-emerald-500/15 text-emerald-800 ring-emerald-600/25 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/35';
    case 'bistro':
      return 'bg-violet-500/15 text-violet-800 ring-violet-600/25 dark:bg-violet-500/20 dark:text-violet-300 dark:ring-violet-400/35';
    case 'loca':
      return 'bg-amber-500/15 text-amber-900 ring-amber-600/30 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-400/35';
    default:
      return 'bg-muted text-foreground ring-border dark:bg-white/10 dark:text-white/85 dark:ring-white/20';
  }
}

export function entryKindBadgeClass(kind: EntryTicketKind): string {
  return kind === 'davetiye'
    ? 'bg-primary/20 text-[var(--bf-neon-on)] ring-primary/40 dark:bg-primary/20 dark:text-primary dark:ring-primary/40'
    : 'bg-sky-500/15 text-sky-800 ring-sky-600/25 dark:bg-sky-500/20 dark:text-sky-300 dark:ring-sky-400/35';
}
