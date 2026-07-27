/**
 * iOS App Tracking Transparency (ATT) — native shell.
 *
 * Guideline 5.1.1(iv): "Ask App Not to Track" sonrası tracking amaçlı
 * çerez / analitik toplanmamalı. Bu modül ATT sonucunu cache'ler; reddedilirse
 * analitik çerezlerini temizler.
 */
let cachedResult: Promise<boolean> | null = null;
let cachedNativeIos: Promise<boolean> | null = null;

export async function isNativeIosApp(): Promise<boolean> {
  if (!cachedNativeIos) {
    cachedNativeIos = (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        return (
          Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
        );
      } catch {
        return false;
      }
    })();
  }
  return cachedNativeIos;
}

async function checkTrackingAuthorized(): Promise<boolean> {
  const { Capacitor } = await import('@capacitor/core');
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();

  if (platform === 'android') return true;

  // Gerçek tarayıcı — ATT yok; çerez banner'ı yönetir.
  // Native shell'de platform yanlışlıkla 'web' görünürse ATT'ye düş (güvenli taraf).
  if (platform === 'web' && !isNative) return true;

  try {
    const { AppTrackingTransparency, AppTrackingTransparencyStatus } =
      await import('capacitor-app-tracking-transparency');

    const att = new AppTrackingTransparency();
    let status = await att.getStatus();

    if (status === AppTrackingTransparencyStatus.notDetermined) {
      status = await att.requestPermission();
    }

    return status === AppTrackingTransparencyStatus.authorized;
  } catch {
    return false;
  }
}

export async function isTrackingAuthorized(): Promise<boolean> {
  if (!cachedResult) {
    cachedResult = checkTrackingAuthorized();
  }
  return cachedResult;
}

/** ATT reddi / tracking kapalıyken tarayıcıda kalmış analitik izlerini sil */
export function purgeTrackingArtifacts(): void {
  if (typeof document === 'undefined') return;

  try {
    localStorage.removeItem('bf_analytics_sid');
  } catch {
    /* ignore */
  }

  const names = document.cookie.split(';').map((c) => c.split('=')[0]?.trim());
  const trackingNames = names.filter(
    (n) =>
      n === '_ga' ||
      n === '_gid' ||
      n === '_gat' ||
      n.startsWith('_ga_') ||
      n.startsWith('_gid') ||
      n.startsWith('_gat')
  );

  for (const name of trackingNames) {
    if (!name) continue;
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
    document.cookie = `${name}=; path=/; domain=${window.location.hostname}; max-age=0; SameSite=Lax`;
    const parts = window.location.hostname.split('.');
    if (parts.length >= 2) {
      const root = parts.slice(-2).join('.');
      document.cookie = `${name}=; path=/; domain=.${root}; max-age=0; SameSite=Lax`;
    }
  }
}
