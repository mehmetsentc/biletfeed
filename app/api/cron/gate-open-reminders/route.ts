import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/security/cron-auth';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { getSiteUrl } from '@/lib/config/domain';
import { queueEmail } from '@/lib/accounting/email';
import { createNotification } from '@/lib/services/notifications';
import { formatTurkeyTime } from '@/lib/datetime/istanbul';

export const dynamic = 'force-dynamic';

/** Kapı açılış hatırlatması — gateOpenTime veya startDate - 30dk */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureDbConnection();
  const now = Date.now();
  const windowStart = new Date(now);
  const windowEnd = new Date(now + 20 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      status: 'published',
      deletedAt: null,
      OR: [
        { gateOpenTime: { gte: windowStart, lte: windowEnd } },
        {
          gateOpenTime: null,
          startDate: { gte: windowStart, lte: windowEnd }
        }
      ]
    },
    select: {
      id: true,
      title: true,
      slug: true,
      gateOpenTime: true,
      startDate: true
    },
    take: 50
  });

  let sent = 0;

  for (const event of events) {
    const orders = await prisma.order.findMany({
      where: { eventId: event.id, status: 'paid', deletedAt: null },
      include: { user: { select: { id: true, email: true, displayName: true } } }
    });

    for (const order of orders) {
      if (!order.user.email) continue;

      const alreadySent = await prisma.emailDelivery.findFirst({
        where: {
          orderId: order.id,
          template: 'gate_open_reminder',
          status: 'sent'
        }
      });
      if (alreadySent) continue;

      const openTime = event.gateOpenTime ?? event.startDate;
      const timeLabel = formatTurkeyTime(openTime);

      await queueEmail({
        to: order.user.email,
        subject: `Kapılar açılıyor: ${event.title}`,
        template: 'gate_open_reminder',
        html: `<p>Merhaba ${order.user.displayName ?? ''},</p><p><strong>${event.title}</strong> etkinliğinde kapılar <strong>${timeLabel}</strong> civarında açılıyor.</p><p><a href="${getSiteUrl(`/etkinlik/${event.slug}`)}">Etkinlik detayı</a> · <a href="${getSiteUrl('/biletlerim')}">Biletlerim</a></p>`,
        orderId: order.id
      });

      await createNotification({
        userId: order.user.id,
        title: 'Kapılar açılıyor',
        body: `${event.title} — giriş ${timeLabel}`,
        type: 'gate_open',
        data: { eventId: event.id }
      });

      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, events: events.length, sent });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
