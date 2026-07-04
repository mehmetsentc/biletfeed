import { isPaymentProviderConfigured, getPaymentProviderName } from '@/lib/payments/config';

export type EnvCheckStatus = 'ok' | 'warn' | 'fail';

export type EnvCheckItem = {
  label: string;
  status: EnvCheckStatus;
  detail: string;
};

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function row(
  label: string,
  status: EnvCheckStatus,
  detail: string
): EnvCheckItem {
  return { label, status, detail };
}

/** Kurulum kontrolü ve admin ayarlar paneli için ortam değişkeni durumu */
export function getEnvStatusItems(): EnvCheckItem[] {
  const items: EnvCheckItem[] = [];

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const fbClient = Boolean(apiKey && projectId);

  items.push(
    row(
      'Firebase Client',
      fbClient ? 'ok' : 'fail',
      fbClient ? 'yapılandırıldı' : 'NEXT_PUBLIC_FIREBASE_* eksik'
    )
  );

  if (apiKey && apiKey.length < 30) {
    items.push(
      row(
        'Firebase API Key',
        'fail',
        'API key çok kısa — Firebase Console\'dan yeniden kopyalayın'
      )
    );
  }

  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const expectedDomain = projectId ? `${projectId}.firebaseapp.com` : '';
  if (fbClient && authDomain && expectedDomain && authDomain !== expectedDomain) {
    items.push(
      row(
        'Firebase authDomain',
        'warn',
        `beklenen: ${expectedDomain}, mevcut: ${authDomain}`
      )
    );
  } else if (fbClient) {
    items.push(
      row('Firebase authDomain', 'ok', authDomain || expectedDomain)
    );
  }

  const adminEnv =
    Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL) &&
    Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  const adminJson = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
  items.push(
    row(
      'Firebase Admin',
      adminEnv || adminJson ? 'ok' : 'fail',
      adminJson
        ? 'FIREBASE_SERVICE_ACCOUNT_JSON ayarlı'
        : adminEnv
          ? 'FIREBASE_ADMIN_* ayarlı'
          : 'firebase-admin.json veya FIREBASE_ADMIN_* gerekli'
    )
  );

  const dbUrl = process.env.DATABASE_URL;
  items.push(
    row(
      'PostgreSQL',
      dbUrl ? 'ok' : 'fail',
      dbUrl ? 'DATABASE_URL ayarlı' : 'DATABASE_URL boş'
    )
  );

  const ticketSecret = process.env.TICKET_SECRET_KEY;
  items.push(
    row(
      'Ticket Secret',
      ticketSecret && ticketSecret !== 'dev-secret-change-in-production'
        ? 'ok'
        : isProduction()
          ? 'fail'
          : 'warn',
      ticketSecret ? 'ayarlı' : 'eksik'
    )
  );

  const sessionSecret = process.env.NEXTAUTH_SECRET;
  items.push(
    row(
      'Session Secret (NEXTAUTH_SECRET)',
      sessionSecret && sessionSecret !== 'dev-session-secret-local-only'
        ? 'ok'
        : isProduction()
          ? 'fail'
          : 'warn',
      sessionSecret ? 'ayarlı' : 'eksik — production için zorunlu'
    )
  );

  if (isProduction() && process.env.ENABLE_MOCK_PAYMENTS === 'true') {
    items.push(
      row('Mock ödeme', 'fail', 'ENABLE_MOCK_PAYMENTS production ortamında kapalı olmalı')
    );
  }

  const cronSecret = process.env.CRON_SECRET?.trim();
  items.push(
    row(
      'Cron Secret',
      cronSecret ? 'ok' : isProduction() ? 'fail' : 'warn',
      cronSecret ? 'ayarlı' : 'CRON_SECRET zorunlu (production)'
    )
  );

  items.push(
    row(
      'Firebase Storage',
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'ok' : 'warn',
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        : 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET eksik'
    )
  );

  const paymentProvider = getPaymentProviderName();
  const configured = isPaymentProviderConfigured(paymentProvider);
  items.push(
    row(
      'Ödeme',
      paymentProvider === 'mock' ? 'warn' : configured ? 'ok' : 'fail',
      paymentProvider === 'mock'
        ? 'mock modu — geliştirme için uygun'
        : configured
          ? `${paymentProvider} anahtarları tanımlı`
          : `${paymentProvider} seçili ama API anahtarları eksik`
    )
  );

  const resendKey = process.env.RESEND_API_KEY?.trim();
  items.push(
    row(
      'E-posta (Resend)',
      resendKey ? 'ok' : isProduction() ? 'warn' : 'warn',
      resendKey ? 'RESEND_API_KEY ayarlı' : 'eksik — e-postalar gönderilmez'
    )
  );

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  items.push(
    row(
      'Redis (Upstash)',
      redisUrl && redisToken ? 'ok' : isProduction() ? 'warn' : 'warn',
      redisUrl && redisToken
        ? 'dağıtık rate limit aktif'
        : 'eksik — bellek içi rate limit (serverless uyarısı)'
    )
  );

  const superAdmins = process.env.SUPER_ADMIN_EMAILS?.trim();
  items.push(
    row(
      'Super Admin',
      superAdmins ? 'ok' : isProduction() ? 'warn' : 'warn',
      superAdmins ? 'SUPER_ADMIN_EMAILS ayarlı' : 'SUPER_ADMIN_EMAILS önerilir'
    )
  );

  const companyIban = process.env.COMPANY_IBAN?.trim();
  items.push(
    row(
      'Muhasebe IBAN',
      companyIban ? 'ok' : 'warn',
      companyIban ? 'COMPANY_IBAN ayarlı' : 'fatura/hakediş için COMPANY_IBAN önerilir'
    )
  );

  const canonicalHost =
    process.env.NEXT_PUBLIC_CANONICAL_HOST ||
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    '';
  items.push(
    row(
      'Subdomain env',
      canonicalHost.includes('biletfeed.com') || canonicalHost.includes('localhost')
        ? 'ok'
        : isProduction()
          ? 'warn'
          : 'warn',
      canonicalHost
        ? `NEXT_PUBLIC_CANONICAL_HOST/ROOT_DOMAIN → ${canonicalHost}`
        : 'NEXT_PUBLIC_CANONICAL_HOST veya ROOT_DOMAIN eksik'
    )
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  if (siteUrl.includes('biletfeed.com')) {
    items.push(row('Production domain', 'ok', siteUrl));
  } else if (siteUrl.includes('vercel.app')) {
    items.push(row('Production domain', 'warn', `${siteUrl} — özel domain bekleniyor`));
  }

  const hasSocial = [
    process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    process.env.NEXT_PUBLIC_FACEBOOK_URL,
    process.env.NEXT_PUBLIC_TWITTER_URL,
    process.env.NEXT_PUBLIC_YOUTUBE_URL
  ].some((url) => Boolean(url?.trim()));
  items.push(
    row(
      'Sosyal medya URL',
      hasSocial ? 'ok' : 'warn',
      hasSocial
        ? 'en az bir NEXT_PUBLIC_* sosyal URL ayarlı'
        : 'footer için NEXT_PUBLIC_INSTAGRAM_URL vb. önerilir'
    )
  );

  return items;
}

export function countEnvFailures(items: EnvCheckItem[]): number {
  return items.filter((item) => item.status === 'fail').length;
}
