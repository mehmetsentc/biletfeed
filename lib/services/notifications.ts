import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export type NotificationInput = {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
};

export async function createNotification(input: NotificationInput): Promise<string> {
  await ensureDbConnection();
  const row = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      data: input.data ? (input.data as object) : undefined
    }
  });
  return row.id;
}

export async function markNotificationRead(
  notificationId: string,
  firebaseUid: string
): Promise<void> {
  await ensureDbConnection();
  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true }
  });
  if (!user) throw new Error('Kullanıcı bulunamadı');

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id, deletedAt: null },
    data: { read: true }
  });
}

export async function markAllNotificationsRead(firebaseUid: string): Promise<void> {
  await ensureDbConnection();
  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true }
  });
  if (!user) return;

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false, deletedAt: null },
    data: { read: true }
  });
}

export async function notifyTicketPurchase(userId: string, eventTitle: string, orderId: string) {
  await createNotification({
    userId,
    title: 'Bilet satın alındı',
    body: `${eventTitle} için biletiniz hazır.`,
    type: 'ticket_purchase',
    data: { orderId }
  });
}

export async function notifyEventReminder(
  userId: string,
  eventTitle: string,
  hoursBefore: number
) {
  const label = hoursBefore >= 24 ? '24 saat' : hoursBefore >= 2 ? '2 saat' : 'yakında';
  await createNotification({
    userId,
    title: 'Etkinlik hatırlatması',
    body: `${eventTitle} etkinliği ${label} içinde başlıyor.`,
    type: 'event_reminder',
    data: { hoursBefore }
  });
}
