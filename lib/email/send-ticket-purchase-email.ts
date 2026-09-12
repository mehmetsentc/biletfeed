import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getSiteUrl } from '@/lib/config/domain';
import { queueEmail } from '@/lib/accounting/email';
import { buildGoogleCalendarUrl } from '@/lib/email/calendar';
import { buildOrderTicketPdfAttachments } from '@/lib/email/build-order-ticket-pdf-attachments';
import { buildTicketPurchaseEmail, buildTicketPurchasePlainText } from '@/lib/email/ticket-purchase-template';
import { qrToDataUrl } from '@/lib/tickets/design/qr-data-url';
import { buildTicketQrPayload } from '@/lib/tickets/sign';
import {
  formatTurkeyDateLong,
  formatTurkeyTimeRange
} from '@/lib/datetime/istanbul';

function formatEventDateTime(start: Date, end: Date): { date: string; time: string; full: string } {
  const date = formatTurkeyDateLong(start);
  const time = formatTurkeyTimeRange(start, end);
  return {
    date,
    time,
    full: `${date} · ${time}`
  };
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
        select: {
          id: true,
          ticketCode: true,
          validationToken: true,
          status: true,
          attendeeName: true,
          ticketType: { select: { name: true } },
          event: {
            select: {
              title: true,
              coverImage: true,
              startDate: true,
              endDate: true,
              isOnline: true,
              onlineUrl: true,
              venue: { select: { name: true, address: true } },
              city: { select: { name: true } }
            }
          }
        },
        orderBy: { event: { startDate: 'asc' } }
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
  const pdfDownloadUrl = firstTicket
    ? getSiteUrl(
        `/api/tickets/pdf?code=${encodeURIComponent(firstTicket.ticketCode)}&token=${encodeURIComponent(firstTicket.validationToken)}&id=${encodeURIComponent(firstTicket.id)}`
      )
    : undefined;

  const pdfAttachments =
    order.purchasedTickets.length > 0
      ? await buildOrderTicketPdfAttachments({
          event,
          holderFallback: order.user.displayName?.trim() ?? '',
          tickets: order.purchasedTickets
        })
      : [];

  const calendarUrl = buildGoogleCalendarUrl({
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    details: `BiletFeed sipariş: ${order.id.slice(0, 8).toUpperCase()}\n${getSiteUrl('/biletlerim')}`,
    location: locationForCalendar
  });

  const currency = event.currency ?? 'TRY';
  const eventDt = formatEventDateTime(event.startDate, event.endDate);
  const uniqueDates = order.purchasedTickets
    .map((ticket) => formatTurkeyDateLong(ticket.event.startDate))
    .filter((value, index, all) => all.indexOf(value) === index);
  const combinedDate = uniqueDates.length > 1 ? uniqueDates.join(' · ') : eventDt.date;

  const ticketCards = await Promise.all(
    order.purchasedTickets.map(async (ticket) => {
      const venueNameForTicket = ticket.event.isOnline
        ? 'Online Etkinlik'
        : ticket.event.venue?.name ?? venueName;
      const cityNameForTicket = ticket.event.city?.name ?? cityName;
      const dt = formatEventDateTime(ticket.event.startDate, ticket.event.endDate);
      const qrPayload = buildTicketQrPayload({
        ticketCode: ticket.ticketCode,
        validationToken: ticket.validationToken,
        ticketId: ticket.id
      });
      return {
        eventTitle: ticket.event.title,
        eventDate: dt.date,
        eventTime: dt.time,
        eventVenue: venueNameForTicket,
        eventCity: cityNameForTicket,
        ticketTypeName: ticket.ticketType.name,
        holderName: ticket.attendeeName?.trim() || order.user.displayName?.trim() || 'Misafir',
        ticketCode: ticket.ticketCode,
        qrDataUrl: await qrToDataUrl(qrPayload, 96)
      };
    })
  );

  const html = buildTicketPurchaseEmail({
    customerName: order.user.displayName?.trim() ?? '',
    eventTitle: event.title,
    eventDate: combinedDate,
    eventTime: eventDt.time,
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
    qrDataUrl: ticketCards[0]?.qrDataUrl ?? '',
    ticketsUrl: getSiteUrl('/biletlerim'),
    eventUrl: getSiteUrl(`/etkinlik/${event.slug}`),
    pdfDownloadUrl,
    calendarUrl,
    rules: event.rules?.trim() || undefined,
    hasPdfAttachment: pdfAttachments.length > 0,
    ticketCards
  });

  const plainParams = {
    customerName: order.user.displayName?.trim() ?? '',
    eventTitle: event.title,
    eventDate: combinedDate,
    eventTime: eventDt.time,
    eventVenue: venueName,
    eventCity: cityName,
    orderNumber: order.id.slice(0, 8).toUpperCase(),
    totalLabel: formatMoney(order.total, currency),
    ticketCodes: order.purchasedTickets.map((t) => t.ticketCode),
    ticketsUrl: getSiteUrl('/biletlerim'),
    pdfDownloadUrl,
    hasPdfAttachment: pdfAttachments.length > 0,
    ticketLines: ticketCards.map((card) => ({
      date: card.eventDate,
      code: card.ticketCode
    }))
  };

  await queueEmail({
    to: order.user.email,
    subject:
      order.purchasedTickets.length > 1
        ? `BiletFeed — ${event.title} biletleriniz`
        : `BiletFeed — ${event.title} biletiniz`,
    template: 'ticket_purchase',
    html,
    text: buildTicketPurchasePlainText(plainParams),
    orderId: order.id,
    attachments: pdfAttachments
  });
}
