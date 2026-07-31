'use client';

import { useEffect, useState } from 'react';
import { useIsNativeApp } from '@/lib/tracking/platform';
import { APPLE_APP_STORE_NUMERIC_ID, mobileAppConfig } from '@/lib/config/mobile-app';

type UpdateInfo = {
  latestVersion: string;
  storeUrl: string;
};

function isNewerVersion(remote: string, installed: string): boolean {
  const r = remote.split('.').map((n) => parseInt(n, 10) || 0);
  const i = installed.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(r.length, i.length);
  for (let idx = 0; idx < len; idx++) {
    const rv = r[idx] ?? 0;
    const iv = i[idx] ?? 0;
    if (rv > iv) return true;
    if (rv < iv) return false;
  }
  return false;
}

/**
 * Native uygulama (Capacitor/iOS) açıldığında arka planda App Store'daki güncel
 * sürümü kontrol eder (iTunes Lookup API). Cihazdaki sürüm eskiyse ekranın
 * altında küçük bir güncelleme kartı gösterir.
 *
 * "Hayır" denirse sadece bu oturumda (React state) sessizce kapanır — kalıcı
 * olarak hiçbir yere kaydedilmez. Bu yüzden uygulama bir sonraki açılışında
 * (WebView yeniden yüklendiğinde), kullanıcı güncelleme yapana kadar kart
 * tekrar gösterilir.
 */
export function AppUpdateChecker() {
  const isNative = useIsNativeApp();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isNative) return;
    let cancelled = false;

    (async () => {
      try {
        const [{ Capacitor }, { App }] = await Promise.all([
          import('@capacitor/core'),
          import('@capacitor/app')
        ]);

        // Şimdilik yalnızca iOS — Google Play mağaza linki henüz yok.
        if (Capacitor.getPlatform() !== 'ios') return;

        const info = await App.getInfo();
        const installedVersion = info.version;
        if (!installedVersion) return;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        let res: Response;
        try {
          res = await fetch(
            `https://itunes.apple.com/lookup?id=${APPLE_APP_STORE_NUMERIC_ID}&country=tr`,
            { signal: controller.signal }
          );
        } finally {
          clearTimeout(timeout);
        }
        if (!res.ok || cancelled) return;

        const data = await res.json();
        const result = data?.results?.[0];
        const latestVersion: string | undefined = result?.version;
        const storeUrl: string | undefined = result?.trackViewUrl;
        if (!latestVersion || cancelled) return;

        if (isNewerVersion(latestVersion, installedVersion)) {
          setUpdateInfo({
            latestVersion,
            storeUrl: storeUrl || mobileAppConfig.storeUrls.ios
          });
        }
      } catch {
        // Güncelleme kontrolü kritik değil — sessizce yut, uygulamayı etkilemesin.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isNative]);

  if (!isNative || !updateInfo || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-0 z-[9998] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-black/95 px-4 py-3.5 text-white shadow-xl backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Yeni sürüm mevcut</p>
          <p className="mt-0.5 text-xs text-white/60">
            BiletFeed {updateInfo.latestVersion} App Store&apos;da yayında.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg px-2.5 py-2 text-xs font-medium text-white/60 transition-colors hover:text-white"
          >
            Hayır
          </button>
          <button
            type="button"
            onClick={() => window.open(updateInfo.storeUrl, '_blank')}
            className="rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-primary/90"
          >
            Güncelle
          </button>
        </div>
      </div>
    </div>
  );
}
