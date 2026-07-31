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
 * ziyaretçilere üstte küçük bir "uygulamayı indir" şeridi gösterir.
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

    setVisible(true);
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
    <div className="relative z-[60] flex items-center gap-3 border-b border-border bg-background px-3 py-2 shadow-sm">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Kapat"
        className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brandAssetUrl('/brand/favicon-192.png')}
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-[9px]"
      />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold">BiletFeed Uygulaması</p>
        <p className="truncate text-xs text-muted-foreground">
          Biletlerini ve etkinlik gündemini uygulamada takip et
        </p>
      </div>
      <a
        href={mobileAppConfig.storeUrls.ios}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-primary/90"
      >
        İndir
      </a>
    </div>
  );
}
