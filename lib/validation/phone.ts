import {
  formatTrPhoneDisplay,
  isValidTrPhone,
  normalizeTrPhone
} from '@/lib/validation/tr-phone';

/** E.164: + and 8–15 digits, country code must not start with 0 */
const E164_RE = /^\+[1-9]\d{7,14}$/;

/**
 * Soft input sanitize for live typing: digits, optional leading +, spaces/dashes/parens.
 * Does not force TR-only digit stripping that would remove `+`.
 */
export function sanitizePhoneInput(value: string): string {
  const cleaned = value.replace(/[^\d+\s()\-]/g, '');
  const plusCount = (cleaned.match(/\+/g) ?? []).length;
  if (plusCount === 0) return cleaned.slice(0, 20);
  // Keep a single leading +; drop any other +
  const withoutPlus = cleaned.replace(/\+/g, '');
  return `+${withoutPlus}`.slice(0, 20);
}

/**
 * Normalize for storage:
 * - TR mobile → `05XXXXXXXXX`
 * - International → E.164 (`+…`)
 */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  // Explicit +90… or 90… (12 digits) → TR local
  if (digits.startsWith('90') && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }

  // Classic TR without country code
  if (/^05\d{9}$/.test(digits)) return digits;
  if (digits.startsWith('5') && digits.length === 10) return `0${digits}`;

  // International with +
  if (hasPlus && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  // International without + (country code included): 8–15 digits, not TR mobile
  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  // Fall back to TR normalizer for partial / ambiguous input
  return normalizeTrPhone(trimmed);
}

export function isValidPhone(value: string): boolean {
  if (!value) return false;
  if (isValidTrPhone(value)) return true;
  return E164_RE.test(value);
}

export function formatPhoneDisplay(value: string): string {
  if (isValidTrPhone(normalizeTrPhone(value)) || isValidTrPhone(value)) {
    return formatTrPhoneDisplay(value);
  }
  return value;
}

export { isValidTrPhone, normalizeTrPhone, formatTrPhoneDisplay };
