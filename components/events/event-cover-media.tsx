import Image from 'next/image';
import type { ReactNode } from 'react';
import { IMAGE_SPECS } from '@/lib/config/image-dimensions';
import { cn } from '@/lib/utils';

type EventCoverMediaProps = {
  src: string;
  alt: string;
  priority?: boolean;
};

/**
 * Etkinlik detay kapağı: yüklenen afişin kendi oranında, kırpmadan.
 * 16:9 kutu + object-cover, 21:9 / ultrawide afişlerin yanlarını kesiyordu.
 */
export function EventCoverMedia({
  src,
  alt,
  priority = false
}: EventCoverMediaProps) {
  const { width, height } = IMAGE_SPECS.eventCover;

  return (
    <div className="flex w-full items-center justify-center overflow-hidden bg-zinc-950">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="mx-auto block aspect-auto h-auto max-h-[min(70vh,760px)] w-full object-contain object-center"
        style={{ width: '100%', height: 'auto', aspectRatio: 'auto' }}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) calc(100vw - 2rem), 1120px"
        quality={85}
        priority={priority}
      />
    </div>
  );
}

type EventCoverFrameProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
  children?: ReactNode;
};

/** Kart / thumb: sabit çerçeve içinde afişin tamamı (object-contain, kırpma yok). */
export function EventCoverFrame({
  src,
  alt,
  sizes,
  className,
  priority,
  unoptimized,
  children
}: EventCoverFrameProps) {
  return (
    <div className={cn('relative overflow-hidden bg-zinc-950', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="pointer-events-none object-contain object-center"
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
      />
      {children}
    </div>
  );
}
