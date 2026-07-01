/** Türkiye Cumhuriyeti kimlik numarası doğrulama */
export function isValidTcKimlik(value: string): boolean {
  const tc = value.replace(/\s/g, '');
  if (!/^\d{11}$/.test(tc)) return false;
  if (tc[0] === '0') return false;

  const digits = tc.split('').map((d) => Number(d));
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const digit10 = (oddSum * 7 - evenSum) % 10;
  if (digit10 !== digits[9]) return false;

  const digit11 = digits.slice(0, 10).reduce((sum, d) => sum + d, 0) % 10;
  return digit11 === digits[10];
}

export function normalizeTcKimlik(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}
