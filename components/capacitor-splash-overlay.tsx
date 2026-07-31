'use client';

import { useEffect, useState } from 'react';
import { useIsNativeApp } from '@/lib/tracking/platform';

const GROW_MS = 900;
const HOLD_MS = 200;
const FADE_MS = 400;

/**
 * iOS/Android native uygulama içinde (Capacitor) açılışta gösterilen,
 * ikonu küçükten orta büyüklüğe animasyonlu şekilde büyüten geçiş ekranı.
 * Native LaunchScreen sadece statik bir kare gösterebildiği için asıl
 * "büyüme" animasyonu burada, web tarafında yapılır — native ekran kısa
 * sürede (capacitor.config.ts → launchShowDuration) otomatik kapanır ve
 * bu katman aynı görünümle (siyah zemin + küçük ikon) devralır.
 *
 * Web tarayıcısında (Capacitor dışında) hiçbir şey render etmez.
 */
export function CapacitorSplashOverlay() {
  const isNative = useIsNativeApp();
  const [phase, setPhase] = useState<'grow' | 'hold' | 'fade' | 'done'>('grow');

  useEffect(() => {
    if (!isNative) return;

    const t1 = setTimeout(() => setPhase('hold'), GROW_MS);
    const t2 = setTimeout(() => setPhase('fade'), GROW_MS + HOLD_MS);
    const t3 = setTimeout(() => setPhase('done'), GROW_MS + HOLD_MS + FADE_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isNative]);

  if (!isNative || phase === 'done') return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      style={{
        opacity: phase === 'fade' ? 0 : 1,
        transition: phase === 'fade' ? `opacity ${FADE_MS}ms ease-out` : undefined,
        pointerEvents: phase === 'fade' ? 'none' : 'auto'
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/app-splash-icon.png"
        alt=""
        width={96}
        height={96}
        style={{
          width: 96,
          height: 96,
          animation: `bf-splash-grow ${GROW_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`
        }}
      />
      <style>{`
        @keyframes bf-splash-grow {
          0% { transform: scale(0.55); opacity: 0.7; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
