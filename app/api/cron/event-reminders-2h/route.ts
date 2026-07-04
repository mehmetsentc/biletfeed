import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/security/cron-auth';
import { sendEventReminderEmails } from '@/lib/email/send-event-reminder-email';
import { notifyEventReminder } from '@/lib/services/notifications';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/** 2 saat önce hatırlatma */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendEventReminderEmails({
    minMsBeforeStart: 1.5 * 60 * 60 * 1000,
    maxMsBeforeStart: 2.5 * 60 * 60 * 1000,
    template: 'event_reminder_2h'
  });

  await ensureDbConnection();
  const now = Date.now();
  const orders = await prisma.order.findMany({
    where: {
      status: 'paid',
      deletedAt: null,
      event: {
        startDate: {
          gte: new Date(now + 1.5 * 60 * 60 * 1000),
          lte: new Date(now + 2.5 * 60 * 60 * 1000)
        },
        status: 'published',
        deletedAt: null
      }
    },
    select: { userId: true, event: { select: { title: true } } },
    take: 100
  });

  for (const order of orders) {
    void notifyEventReminder(order.userId, order.event.title, 2).catch(() => {});
  }

  return NextResponse.json({ ok: true, ...result, inApp: orders.length });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
