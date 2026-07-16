import { getDefaultCommissionRate } from '@/lib/services/platform-settings';

/** Organizatör override yoksa platform varsayılanını uygular */
export async function resolveOrganizerCommissionRate(
  organizerRate: number | null | undefined
): Promise<number> {
  if (organizerRate != null) return organizerRate;
  return getDefaultCommissionRate();
}

export function calculateOrderCommission(subtotal: number, commissionRate: number): number {
  return Math.round(subtotal * commissionRate * 100) / 100;
}
