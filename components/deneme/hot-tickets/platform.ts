'use client';

import { useEffect, useState } from 'react';

/** Hot Tickets yüzeyleri — layout ve etkileşim buna göre değişir. */
export type HotTicketsPlatform = 'mobile' | 'tablet' | 'web' | 'tv';

/**
 * Breakpoint’ler (CSS ile hizalı):
 * - mobile < 768
 * - tablet 768–1023
 * - web    1024–1919
 * - tv     ≥ 1920 veya (geniş + coarse pointer, TV/STB)
 */
export function resolveHotTicketsPlatform(
  width: number,
  opts?: { coarsePointer?: boolean; hoverNone?: boolean }
): HotTicketsPlatform {
  const tvLike =
    width >= 1280 && Boolean(opts?.coarsePointer) && Boolean(opts?.hoverNone);
  if (width >= 1920 || tvLike) return 'tv';
  if (width >= 1024) return 'web';
  if (width >= 768) return 'tablet';
  return 'mobile';
}

export function useHotTicketsPlatform(): HotTicketsPlatform {
  const [platform, setPlatform] = useState<HotTicketsPlatform>('mobile');

  useEffect(() => {
    const mqCoarse = window.matchMedia('(pointer: coarse)');
    const mqHover = window.matchMedia('(hover: none)');

    const update = () => {
      setPlatform(
        resolveHotTicketsPlatform(window.innerWidth, {
          coarsePointer: mqCoarse.matches,
          hoverNone: mqHover.matches
        })
      );
    };

    update();
    window.addEventListener('resize', update);
    mqCoarse.addEventListener?.('change', update);
    mqHover.addEventListener?.('change', update);
    return () => {
      window.removeEventListener('resize', update);
      mqCoarse.removeEventListener?.('change', update);
      mqHover.removeEventListener?.('change', update);
    };
  }, []);

  return platform;
}

export const PLATFORM_LABEL: Record<HotTicketsPlatform, string> = {
  mobile: 'Mobil',
  tablet: 'Tablet',
  web: 'Web',
  tv: 'TV'
};
