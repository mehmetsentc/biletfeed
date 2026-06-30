import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getSiteUrl } from '@/lib/config/domain';
import { queueEmail } from '@/lib/accounting/email';
import { buildGoogleCalendarUrl } from '@/lib/email/calendar';
import { buildTicketPurchaseEmail } from '@/lib/email/ticket-purchase-template';

function formatEventDateTime(start: Date, end: Date): string {
  const date = start.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const startTime = start.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const endTime = end.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${date} · ${startTime} – ${endTime}`;
}

function formatMoney(amount: number, currency: string): string {
  if (amount <= 0) return 'Ücretsiz';
  const symbol = currency === 'TRY' ? '₺' : `${currency} `;
  return `${symbol}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
}

/** Bilet satın alma sonrası profesyonel onay e-postası — idempotent */
export async function sendTicketPurchaseEmail(
  orderId: string,
  options?: { force?: boolean }
): Promise<void> {
  await ensureDbConnection();

  if (!options?.force) {
    const alreadySent = await prisma.emailDelivery.findFirst({
      where: { orderId, template: 'ticket_purchase', status: 'sent' }
    });
    if (alreadySent) return;
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, status: 'paid', deletedAt: null },
    include: {
      user: { select: { email: true, displayName: true } },
      organizer: { select: { name: true } },
      items: { include: { ticketType: { select: { name: true } } } },
      purchasedTickets: {
        select: { ticketCode: true, validationToken: true, id: true }
      },
      event: {
        select: {
          title: true,
          slug: true,
          coverImage: true,
          startDate: true,
          endDate: true,
          rules: true,
          currency: true,
          isOnline: true,
          onlineUrl: true,
          venue: { select: { name: true, address: true } },
          city: { select: { name: true } }
        }
      }
    }
  });

  if (!order?.user.email) return;
  if (order.paymentProvider === 'invitation') return;

  const event = order.event;
  const venueName = event.isOnline
    ? 'Online Etkinlik'
    : event.venue?.name ?? 'Mekan bilgisi yakında';
  const cityName = event.city?.name ?? '';
  const locationForCalendar = event.isOnline
    ? event.onlineUrl ?? 'Online'
    : [event.venue?.name, event.venue?.address, cityName].filter(Boolean).join(', ');

  const firstTicket = order.purchasedTickets[0];
  const printUrl = firstTicket
    ? getSiteUrl(
        `/api/tickets/pdf?code=${encodeURIComponent(firstTicket.ticketCode)}&token=${encodeURIComponent(firstTicket.validationToken)}&id=${encodeURIComponent(firstTicket.id)}`
      )
    : undefined;

  const calendarUrl = buildGoogleCalendarUrl({
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    details: `BiletFeed sipariş: ${order.id.slice(0, 8).toUpperCase()}\n${getSiteUrl('/biletlerim')}`,
    location: locationForCalendar
  });

  const currency = event.currency ?? 'TRY';

  const html = buildTicketPurchaseEmail({
    customerName: order.user.displayName?.trim() ?? '',
    eventTitle: event.title,
    eventDate: formatEventDateTime(event.startDate, event.endDate),
    eventVenue: venueName,
    eventCity: cityName,
    coverImage: event.coverImage ?? '',
    organizerName: order.organizer.name,
    orderNumber: order.id.slice(0, 8).toUpperCase(),
    totalLabel: formatMoney(order.total, currency),
    ticketLines: order.items.map((item) => ({
      name: item.ticketType.name,
      quantity: item.quantity,
      unitPrice: formatMoney(item.unitPrice * item.quantity, currency)
    })),
    ticketCodes: order.purchasedTickets.map((t) => t.ticketCode),
    ticketsUrl: getSiteUrl('/biletlerim'),
    eventUrl: getSiteUrl(`/etkinlik/${event.slug}`),
    printUrl,
    calendarUrl,
    rules: event.rules?.trim() || undefined
  });

  await queueEmail({
    to: order.user.email,
    subject: `Biletiniz hazır — ${event.title}`,
    template: 'ticket_purchase',
    html,
    orderId: order.id
  });
}
