import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getSiteUrl } from '@/lib/config/domain';
import { queueEmail } from '@/lib/accounting/email';
import { buildGoogleCalendarUrl } from '@/lib/email/calendar';
import { isDeliverableEmail } from '@/lib/email/deliverable';
import { buildEventReminderEmail } from '@/lib/email/event-reminder-template';
import { formatTurkeyDateLong, formatTurkeyTimeRange, turkeyCalendarDayDiff } from '@/lib/datetime/istanbul';

function formatEventDateTime(start: Date, end: Date): string {
  return `${formatTurkeyDateLong(start)} · ${formatTurkeyTimeRange(start, end)}`;
}

export type EventReminderWindow = {
  /** Hatırlatma penceresi başlangıcı (ms) — varsayılan 23 saat */
  minMsBeforeStart?: number;
  /** Hatırlatma penceresi bitişi (ms) — varsayılan 25 saat */
  maxMsBeforeStart?: number;
  /** E-posta şablon anahtarı */
  template?: string;
};

/**
 * Yaklaşan etkinlikler için hatırlatma e-postası gönderir.
 * Cron: GET /api/cron/event-reminders (henüz route yok — docs/EMAIL.md)
 */
export async function sendEventReminderEmails(
  window: EventReminderWindow = {}
): Promise<{ sent: number; skipped: number }> {
  await ensureDbConnection();

  const minMs = window.minMsBeforeStart ?? 23 * 60 * 60 * 1000;
  const maxMs = window.maxMsBeforeStart ?? 25 * 60 * 60 * 1000;
  const template = window.template ?? 'event_reminder';
  const now = Date.now();
  const rangeStart = new Date(now + minMs);
  const rangeEnd = new Date(now + maxMs);

  const orders = await prisma.order.findMany({
    where: {
      status: 'paid',
      deletedAt: null,
      event: {
        startDate: { gte: rangeStart, lte: rangeEnd },
        status: 'published',
        deletedAt: null
      }
    },
    include: {
      user: { select: { email: true, displayName: true } },
      event: {
        select: {
          title: true,
          slug: true,
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
    take: 200
  });

  let sent = 0;
  let skipped = 0;

  for (const order of orders) {
    if (!isDeliverableEmail(order.user.email)) {
      skipped += 1;
      continue;
    }

    const alreadySent = await prisma.emailDelivery.findFirst({
      where: { orderId: order.id, template, status: 'sent' }
    });
    if (alreadySent) {
      skipped += 1;
      continue;
    }

    const event = order.event;
    const venueName = event.isOnline
      ? 'Online Etkinlik'
      : event.venue?.name ?? 'Mekan';
    const cityName = event.city?.name ?? '';
    const locationForCalendar = event.isOnline
      ? event.onlineUrl ?? 'Online'
      : [event.venue?.name, event.venue?.address, cityName]
          .filter(Boolean)
          .join(', ');

    const daysUntil = Math.max(0, turkeyCalendarDayDiff(event.startDate, new Date(now)));

    const calendarUrl = buildGoogleCalendarUrl({
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      details: `BiletFeed — ${getSiteUrl('/biletlerim')}`,
      location: locationForCalendar
    });

    const html = buildEventReminderEmail({
      customerName: order.user.displayName?.trim() ?? '',
      eventTitle: event.title,
      eventDate: formatEventDateTime(event.startDate, event.endDate),
      eventVenue: venueName,
      eventCity: cityName,
      coverImage: event.coverImage ?? undefined,
      ticketsUrl: getSiteUrl('/biletlerim'),
      eventUrl: getSiteUrl(`/etkinlik/${event.slug}`),
      calendarUrl,
      daysUntil
    });

    const whenLabel =
      daysUntil <= 0 ? 'bugün' : daysUntil === 1 ? 'yarın' : `${daysUntil} gün sonra`;

    await queueEmail({
      to: order.user.email,
      subject: `Hatırlatma: ${event.title} ${whenLabel}`,
      template,
      html,
      orderId: order.id
    });
    sent += 1;
  }

  return { sent, skipped };
}
