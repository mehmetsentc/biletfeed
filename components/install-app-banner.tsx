'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useIsNativeApp } from '@/lib/tracking/platform';
import { mobileAppConfig } from '@/lib/config/mobile-app';
import { brandAssetUrl } from '@/lib/config/brand-theme';

const DISMISS_KEY = 'bf-app-banner-dismissed-at';
const DISMISS_DAYS = 14;

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIphoneOrIpad = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ Safari, masaüstü gibi görünür — dokunmatik ekran ile ayırt ediyoruz.
  const isIpadOS13 = ua.includes('Mac') && 'ontouchend' in document;
  return isIphoneOrIpad || isIpadOS13;
}

/**
 * Tarayıcıdan (Safari/Chrome) siteye giren, uygulamayı henüz yüklememiş
 * ziyaretçilere sayfa ortasında, temaya uygun küçük bir "uygulamayı indir"
 * kartı gösterir.
 *
 * Native uygulama içinde hiçbir zaman gösterilmez. Şimdilik yalnızca iOS —
 * Google Play mağaza linki yayınlanınca Android da eklenebilir.
 *
 * "Kapat" (X) tıklanınca 14 gün boyunca tekrar gösterilmez; sonra tekrar
 * ilk-kez-gelen bir ziyaretçiye gösterir gibi ortaya çıkar.
 */
export function InstallAppBanner() {
  const isNative = useIsNativeApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isNative) return;
    if (!isIosDevice()) return;
    if (!mobileAppConfig.storeUrls.ios) return;

    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSince < DISMISS_DAYS) return;
      }
    } catch {
      // localStorage kapalıysa (gizli sekme vb.) sessizce göster.
    }

    // Sayfa açılır açılmaz değil, kısa bir gecikmeyle göster — böylece ilk
    // içerik yüklenmesiyle çakışmaz.
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, [isNative]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // yut
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="BiletFeed Uygulaması"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-background text-foreground shadow-xl animate-in zoom-in-95 fade-in-0 duration-200"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Kapat"
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brandAssetUrl('/brand/favicon-192.png')}
            alt=""
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-[14px] shadow-sm"
          />
          <div>
            <p className="text-base font-semibold">BiletFeed Uygulaması</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Biletlerini ve etkinlik gündemini uygulamada takip et
            </p>
          </div>

          <div className="mt-2 flex w-full flex-col gap-2">
            <a
              href={mobileAppConfig.storeUrls.ios}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              İndir
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="w-full rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Vazgeç
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
