/** Türkiye cep telefonu: 05XXXXXXXXX */
export function normalizeTrPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  if (digits.startsWith('5') && digits.length === 10) {
    return `0${digits}`;
  }
  return digits;
}

export function isValidTrPhone(value: string): boolean {
  return /^05\d{9}$/.test(value);
}

export function formatTrPhoneDisplay(value: string): string {
  const n = normalizeTrPhone(value);
  if (n.length !== 11) return value;
  return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7, 9)} ${n.slice(9)}`;
}
