import { getSiteUrl } from '@/lib/config/domain';
import { platformContact } from '@/lib/config/contact';
import { siteConfig } from '@/lib/config/site';

/** App Store / Google Play metadata — tek kaynak */
export const mobileAppConfig = {
  bundleId: 'com.biletfeed.app',
  androidPackageName: 'com.biletfeed.app',
  /** Alias — eski referanslar için */
  appId: 'com.biletfeed.app',
  appName: 'BiletFeed',
  version: '1.0.0',
  buildNumber: '1',
  supportEmail: platformContact.email,
  supportHours: platformContact.supportHours,
  privacyPolicyUrl: getSiteUrl('/gizlilik'),
  termsUrl: getSiteUrl('/kosullar'),
  userAgreementUrl: getSiteUrl('/kullanici-sozlesmesi'),
  accountDeletionUrl: getSiteUrl('/mobil-uygulama#hesap-silme'),
  reviewInfoUrl: getSiteUrl('/mobil-uygulama'),
  appInfoUrl: getSiteUrl('/mobil-uygulama'),
  websiteUrl: getSiteUrl('/'),
  serverUrl: process.env.CAPACITOR_SERVER_URL?.trim() || getSiteUrl('/'),
  storeCategory: {
    apple: 'Entertainment',
    google: 'EVENTS'
  },
  ageRating: {
    apple: '4+',
    google: 'Everyone',
    notes:
      'Uygulama etkinlik keşfi ve bilet satışı sunar. Kullanıcı tarafından oluşturulan içerik yoktur; şiddet, cinsellik veya kumar içeriği bulunmaz. Ödeme işlemleri yetişkin kullanıcılar tarafından gerçekleştirilir.'
  },
  description: {
    short: siteConfig.description,
    full:
      'BiletFeed ile konser, tiyatro, festival ve daha fazlasını keşfedin. Bilet satın alın, QR biletinizi görüntüleyin ve etkinliklerinizi yönetin.'
  },
  storeUrls: {
    ios: process.env.NEXT_PUBLIC_APP_STORE_URL ?? '',
    android: process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? ''
  },
  appleTeamId: process.env.APPLE_TEAM_ID?.trim() ?? '',
  androidSha256Fingerprint:
    process.env.ANDROID_SHA256_FINGERPRINT?.trim() ?? ''
} as const;

export type MobileAppConfig = typeof mobileAppConfig;

export function getAppleAppId(): string {
  const teamId = mobileAppConfig.appleTeamId;
  if (!teamId) return mobileAppConfig.bundleId;
  return `${teamId}.${mobileAppConfig.bundleId}`;
}
