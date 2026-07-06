/** Luhn algoritması — Tosla dokümantasyonu gereksinimi */
export function isValidCardNumber(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number.parseInt(digits[i]!, 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function formatCardNumberDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function normalizeCardNumber(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function formatExpiryInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function normalizeExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 4) return '';
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function isExpiryValid(raw: string): boolean {
  const normalized = normalizeExpiry(raw);
  if (!/^\d{2}\/\d{2}$/.test(normalized)) return false;

  const [mmRaw, yyRaw] = normalized.split('/');
  const month = Number.parseInt(mmRaw!, 10);
  const year = 2000 + Number.parseInt(yyRaw!, 10);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const expiryEnd = new Date(year, month, 0, 23, 59, 59, 999);
  return expiryEnd >= now;
}

export function isValidCvv(raw: string, cardNumber: string): boolean {
  const cvv = raw.replace(/\D/g, '');
  const isAmex = cardNumber.replace(/\D/g, '').startsWith('34') ||
    cardNumber.replace(/\D/g, '').startsWith('37');
  return isAmex ? cvv.length === 4 : cvv.length === 3;
}

export function detectCardBrand(cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'unknown' {
  const digits = cardNumber.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'visa';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  return 'unknown';
}
