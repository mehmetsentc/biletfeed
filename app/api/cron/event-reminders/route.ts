import { NextRequest, NextResponse } from 'next/server';
import { sendEventReminderEmails } from '@/lib/email/send-event-reminder-email';
import { notifyEventReminder } from '@/lib/services/notifications';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;
  return request.headers.get('x-cron-secret') === secret;
}

/** 24 saat önce hatırlatma — günde 2 kez */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendEventReminderEmails();

  await ensureDbConnection();
  const now = Date.now();
  const orders = await prisma.order.findMany({
    where: {
      status: 'paid',
      deletedAt: null,
      event: {
        startDate: {
          gte: new Date(now + 23 * 60 * 60 * 1000),
          lte: new Date(now + 25 * 60 * 60 * 1000)
        },
        status: 'published',
        deletedAt: null
      }
    },
    select: { userId: true, event: { select: { title: true } } },
    take: 200
  });

  for (const order of orders) {
    void notifyEventReminder(order.userId, order.event.title, 24).catch(() => {});
  }

  return NextResponse.json({ ok: true, ...result, inApp: orders.length });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
