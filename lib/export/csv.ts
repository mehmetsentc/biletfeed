const CSV_BOM = '\uFEFF';
const CSV_DELIMITER = ';';

export function csvEscape(value: string): string {
  if (
    value.includes(';') ||
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatDateTimeTr(date: Date | null | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

export function buildCsv(rows: string[][]): string {
  const content = rows
    .map((row) => row.map((cell) => csvEscape(cell)).join(CSV_DELIMITER))
    .join('\n');
  return CSV_BOM + content;
}

export function ticketStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    VALID: 'Geçerli',
    USED: 'Kullanıldı',
    CANCELLED: 'İptal Edildi',
    REFUNDED: 'İade Edildi'
  };
  return labels[status] ?? status;
}

export function yesNo(value: boolean): string {
  return value ? 'Evet' : 'Hayır';
}

export const TICKET_DETAIL_HEADERS = [
  'Bilet Kodu',
  'Bilet Türü',
  'Sahip Adı',
  'E-posta',
  'Telefon',
  'Sipariş No',
  'Kupon Kodu',
  'Kupon Adı',
  'Satın Alma Tarihi',
  'Bilet Durumu',
  'Giriş Yapıldı mı',
  'Giriş Sayısı',
  'İlk Giriş Zamanı',
  'Son Giriş Zamanı',
  'Davetiye mi',
  'Davetiye Görüntülendi mi'
] as const;

export const TICKET_DETAIL_HEADERS_WITH_EVENT = [
  'Bilet Kodu',
  'Etkinlik Adı',
  ...TICKET_DETAIL_HEADERS.slice(1)
] as const;

export type TicketExportData = {
  ticketCode: string;
  ticketType: { name: string };
  attendeeName: string | null;
  attendeeEmail: string | null;
  attendeePhone: string | null;
  user: { displayName: string; email: string };
  orderId: string;
  order: { paidAt: Date | null; createdAt: Date; couponCode: string | null };
  status: string;
  entryCount: number;
  scannedAt: Date | null;
  invitation: { guestPhone: string | null; viewedAt: Date | null } | null;
  checkIns: { createdAt: Date }[];
  event?: { title: string };
};

export function buildTicketDetailRow(
  ticket: TicketExportData,
  includeEvent = false,
  couponLabelMap?: Map<string, string>
): string[] {
  const purchaseDate = ticket.order.paidAt ?? ticket.order.createdAt;
  const checkedIn = ticket.entryCount > 0 || ticket.scannedAt != null;
  const firstEntry =
    ticket.scannedAt ?? ticket.checkIns[0]?.createdAt ?? null;
  const lastEntry =
    ticket.scannedAt ??
    ticket.checkIns[ticket.checkIns.length - 1]?.createdAt ??
    null;
  const isInvitation = ticket.invitation != null;
  const invitationViewed = ticket.invitation?.viewedAt != null;
  const couponCode = ticket.order.couponCode ?? '';
  const couponLabel = couponCode
    ? (couponLabelMap?.get(couponCode.toUpperCase()) ?? '')
    : '';

  return [
    ticket.ticketCode,
    ...(includeEvent ? [ticket.event?.title ?? ''] : []),
    ticket.ticketType.name,
    ticket.attendeeName?.trim() || ticket.user.displayName,
    ticket.attendeeEmail || ticket.user.email,
    ticket.attendeePhone ?? ticket.invitation?.guestPhone ?? '',
    ticket.orderId,
    couponCode,
    couponLabel,
    formatDateTimeTr(purchaseDate),
    ticketStatusLabel(ticket.status),
    yesNo(checkedIn),
    String(ticket.entryCount),
    formatDateTimeTr(firstEntry),
    formatDateTimeTr(lastEntry),
    yesNo(isInvitation),
    yesNo(invitationViewed)
  ];
}

const ticketExportInclude = {
  ticketType: { select: { name: true } },
  user: { select: { displayName: true, email: true } },
  order: {
    select: {
      paidAt: true,
      createdAt: true,
      paymentProvider: true,
      status: true,
      couponCode: true
    }
  },
  invitation: { select: { guestPhone: true, viewedAt: true, status: true } },
  checkIns: { orderBy: { createdAt: 'asc' as const }, select: { createdAt: true } }
} as const;

export const ticketCsvInclude = ticketExportInclude;

export const ticketCsvIncludeWithEvent = {
  ...ticketExportInclude,
  event: { select: { title: true } }
} as const;

function paymentProviderLabel(provider: string): string {
  const labels: Record<string, string> = {
    iyzico: 'İyzico',
    stripe: 'Stripe',
    paytr: 'PayTR',
    mock: 'Test',
    free: 'Ücretsiz',
    invitation: 'Davetiye'
  };
  return labels[provider] ?? provider;
}

function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    paid: 'Ödendi',
    pending: 'Beklemede',
    refunded: 'İade Edildi',
    cancelled: 'İptal Edildi'
  };
  return labels[status] ?? status;
}

export const ORDER_SUMMARY_HEADERS = [
  'Sipariş No',
  'Müşteri Adı',
  'E-posta',
  'Tutar (₺)',
  'Ödeme Yöntemi',
  'Ödeme Durumu',
  'Satın Alma Tarihi',
  'Kupon Kodu',
  'Kupon Adı',
  'Bilet Kalemleri'
] as const;

export type OrderExportData = {
  id: string;
  attendeeName: string | null;
  attendeeEmail: string | null;
  total: number;
  paidAt: Date | null;
  createdAt: Date;
  paymentProvider: string;
  status: string;
  couponCode: string | null;
  user: { displayName: string; email: string };
  items: { quantity: number; ticketType: { name: string } }[];
};

export function buildOrderSummaryRow(
  order: OrderExportData,
  couponLabelMap?: Map<string, string>
): string[] {
  const couponCode = order.couponCode ?? '';
  const couponLabel = couponCode
    ? (couponLabelMap?.get(couponCode.toUpperCase()) ?? '')
    : '';

  return [
    order.id,
    order.attendeeName?.trim() || order.user.displayName,
    order.attendeeEmail || order.user.email,
    order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
    paymentProviderLabel(order.paymentProvider),
    orderStatusLabel(order.status),
    formatDateTimeTr(order.paidAt ?? order.createdAt),
    couponCode,
    couponLabel,
    order.items.map((i) => `${i.quantity}x ${i.ticketType.name}`).join(', ')
  ];
}
