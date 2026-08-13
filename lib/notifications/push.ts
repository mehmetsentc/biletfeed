/**
 * Push gönderim katmanı — kayıtlı cihaz token’larına FCM ile iletir.
 * Firebase Admin + cihaz token yoksa no-op (in-app bildirim yine oluşur).
 */

import { ensureDbConnection, prisma } from '@/lib/db/prisma';

export type PushPayload = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

async function sendViaFirebaseAdmin(
  tokens: string[],
  payload: PushPayload
): Promise<number> {
  try {
    const { getAdminApp } = await import('@/lib/firebase/admin');
    const app = getAdminApp();
    const { getMessaging } = await import('firebase-admin/messaging');
    const messaging = getMessaging(app);

    const res = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: payload.data,
      webpush: {
        fcmOptions: {
          link: payload.data?.url || '/bildirimler'
        }
      }
    });

    // Geçersiz token’ları soft-delete
    const invalid: string[] = [];
    res.responses.forEach((r, i) => {
      if (
        !r.success &&
        (r.error?.code === 'messaging/registration-token-not-registered' ||
          r.error?.code === 'messaging/invalid-registration-token')
      ) {
        const t = tokens[i];
        if (t) invalid.push(t);
      }
    });
    if (invalid.length) {
      await prisma.pushDeviceToken.updateMany({
        where: { token: { in: invalid } },
        data: { deletedAt: new Date() }
      });
    }

    return res.successCount;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[push] FCM gönderilemedi', err);
    }
    return 0;
  }
}

export async function sendPushNotification(payload: PushPayload): Promise<boolean> {
  await ensureDbConnection();

  const user = await prisma.user.findFirst({
    where: { id: payload.userId, deletedAt: null },
    select: { notifyPush: true }
  });
  if (!user?.notifyPush) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[push:skip]', 'notifyPush kapalı', payload.userId);
    }
    return false;
  }

  const devices = await prisma.pushDeviceToken.findMany({
    where: { userId: payload.userId, deletedAt: null },
    select: { token: true },
    take: 20
  });

  if (devices.length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[push:stub]', payload.title, payload.userId);
    }
    return false;
  }

  const sent = await sendViaFirebaseAdmin(
    devices.map((d) => d.token),
    payload
  );
  return sent > 0;
}
