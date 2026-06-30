/**
 * FCM / Web Push entegrasyonu için hazırlık katmanı.
 * FIREBASE_* env değişkenleri yapılandırıldığında sendPushNotification genişletilir.
 */

export type PushPayload = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

export async function sendPushNotification(payload: PushPayload): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[push:stub]', payload.title, payload.userId);
  }
  // FCM server key veya Firebase Admin messaging eklendiğinde burada gönderilir.
  return false;
}
