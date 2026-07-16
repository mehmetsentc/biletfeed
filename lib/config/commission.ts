/** Ortam değişkeni yoksa kullanılan sabit varsayılan hizmet bedeli oranı */
export const FALLBACK_DEFAULT_COMMISSION_RATE = 0.06;

export const PLATFORM_SETTING_KEY_DEFAULT_COMMISSION_RATE = 'default_commission_rate';

export function parseCommissionRate(value: string | null | undefined): number | null {
  if (value == null || value.trim() === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return null;
  return parsed;
}

export function formatCommissionRatePercent(rate: number): string {
  const percent = rate * 100;
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(1);
}
