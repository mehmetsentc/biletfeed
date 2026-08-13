import { ensureDbConnection, prisma } from '@/lib/db/prisma';
import {
  subscribeToNewsletter,
  unsubscribeFromNewsletter
} from '@/lib/services/newsletter';
import { CITY_COOKIE_NAME } from '@/lib/location/city-preference.constants';
import { SUPPORTED_CITIES } from '@/lib/location/cities';

export type UserNotificationPreferences = {
  email: boolean;
  sms: boolean;
  push: boolean;
  newsletter: boolean;
};

export async function getUserNotificationPreferences(
  firebaseUid: string
): Promise<UserNotificationPreferences | null> {
  await ensureDbConnection();
  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: {
      notifyEmail: true,
      notifySms: true,
      notifyPush: true,
      notifyNewsletter: true
    }
  });
  if (!user) return null;
  return {
    email: user.notifyEmail,
    sms: user.notifySms,
    push: user.notifyPush,
    newsletter: user.notifyNewsletter
  };
}

export async function updateUserNotificationPreferences(
  firebaseUid: string,
  prefs: Partial<UserNotificationPreferences>,
  options?: {
    subscribeNewsletter?: boolean;
    citySlug?: string | null;
  }
): Promise<UserNotificationPreferences> {
  await ensureDbConnection();

  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true, email: true }
  });
  if (!user) throw new Error('Kullanıcı bulunamadı');

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(prefs.email !== undefined ? { notifyEmail: prefs.email } : {}),
      ...(prefs.sms !== undefined ? { notifySms: prefs.sms } : {}),
      ...(prefs.push !== undefined ? { notifyPush: prefs.push } : {}),
      ...(prefs.newsletter !== undefined
        ? { notifyNewsletter: prefs.newsletter }
        : {})
    },
    select: {
      notifyEmail: true,
      notifySms: true,
      notifyPush: true,
      notifyNewsletter: true,
      email: true
    }
  });

  const wantNewsletter =
    options?.subscribeNewsletter ??
    (prefs.newsletter !== undefined ? prefs.newsletter : undefined);

  if (wantNewsletter === true && updated.email) {
    const city = options?.citySlug
      ? SUPPORTED_CITIES.find((c) => c.slug === options.citySlug)
      : null;
    await subscribeToNewsletter(updated.email, {
      source: 'notification_prefs',
      citySlug: city?.slug ?? null,
      cityName: city?.name ?? null
    });
  } else if (wantNewsletter === false && updated.email) {
    await unsubscribeFromNewsletter(updated.email);
  }

  return {
    email: updated.notifyEmail,
    sms: updated.notifySms,
    push: updated.notifyPush,
    newsletter: updated.notifyNewsletter
  };
}

export function resolveCitySlugFromCookieHeader(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${CITY_COOKIE_NAME}=`));
  if (!match) return null;
  return decodeURIComponent(match.split('=')[1] ?? '') || null;
}

export async function registerPushDeviceToken(params: {
  firebaseUid: string;
  token: string;
  platform: string;
  userAgent?: string | null;
}): Promise<void> {
  await ensureDbConnection();
  const user = await prisma.user.findFirst({
    where: { firebaseUid: params.firebaseUid, deletedAt: null },
    select: { id: true }
  });
  if (!user) throw new Error('Kullanıcı bulunamadı');

  const existing = await prisma.pushDeviceToken.findUnique({
    where: { token: params.token }
  });

  if (existing) {
    await prisma.pushDeviceToken.update({
      where: { id: existing.id },
      data: {
        userId: user.id,
        platform: params.platform,
        userAgent: params.userAgent ?? null,
        deletedAt: null
      }
    });
    return;
  }

  await prisma.pushDeviceToken.create({
    data: {
      userId: user.id,
      token: params.token,
      platform: params.platform,
      userAgent: params.userAgent ?? null
    }
  });
}

export async function removePushDeviceToken(
  firebaseUid: string,
  token: string
): Promise<void> {
  await ensureDbConnection();
  const user = await prisma.user.findFirst({
    where: { firebaseUid, deletedAt: null },
    select: { id: true }
  });
  if (!user) return;

  await prisma.pushDeviceToken.updateMany({
    where: { userId: user.id, token, deletedAt: null },
    data: { deletedAt: new Date() }
  });
}
