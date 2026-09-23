/** Fiziki baskı stoğu — ciroya yazılmaz, kapı QR'ı geçerlidir. */
export const PRINT_PAYMENT_PROVIDER = 'print';

export const PRINT_TICKET_MAX = 500;

/** A4 sayfada kaç bilet (ön ve arka aynı ızgarada hizalanır). */
export const PRINT_TICKETS_PER_SHEET = 3;

/** Satış cirosu ve sipariş adedinden düşülen sağlayıcılar. */
export const NON_SALE_PAYMENT_PROVIDERS = ['invitation', PRINT_PAYMENT_PROVIDER] as const;

export function excludeNonSaleProviders() {
  return { notIn: [...NON_SALE_PAYMENT_PROVIDERS] };
}

export const PRINT_TICKET_NON_REFUNDABLE =
  'İade edilemez, değiştirilemez veya iptal edilemez.';

export const PRINT_TICKET_TERMS =
  'Bu bilet BiletFeed üzerinden düzenlenmiştir. Yalnızca üzerinde yazılı etkinlik, tarih, mekan ve bilet türü için geçerlidir. Girişte QR kod okutulur; bilet tek kullanımlıktır ve kopyası geçersizdir. Organizatör, güvenlik gerekçesiyle girişi reddetme hakkını saklı tutar. Kayıp veya yıpranmış bilet yeniden basılmaz; kapı kaydı esastır.';

export function formatPrintSequence(sequence: number): string {
  return String(sequence).padStart(6, '0');
}

/** Örnek: A1B2-0000001 — parti kimliği + sıra. */
export function formatPrintSerial(orderId: string, sequence: number): string {
  const key = orderId.replace(/-/g, '').slice(0, 4).toUpperCase() || 'BF00';
  return `${key}-${String(sequence).padStart(7, '0')}`;
}

export function formatPrintAttendeeName(sequence: number): string {
  return `Baskı #${formatPrintSequence(sequence)}`;
}

export function sequenceFromPrintAttendee(name: string | null | undefined): number | null {
  const match = name?.match(/^Baskı #(\d+)$/);
  if (!match?.[1]) return null;
  const value = Number(match[1]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function groupIntoSheets<T>(items: T[], perSheet = PRINT_TICKETS_PER_SHEET): T[][] {
  const sheets: T[][] = [];
  for (let i = 0; i < items.length; i += perSheet) {
    sheets.push(items.slice(i, i + perSheet));
  }
  return sheets;
}
