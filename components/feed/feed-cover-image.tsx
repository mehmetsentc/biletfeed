'use client';

import { useEffect, useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { FEED_FALLBACK_COVER } from '@/lib/feed/constants';
import { cn } from '@/lib/utils';

type FeedCoverImageProps = Omit<ImageProps, 'src' | 'onError'> & {
  src?: string | null;
};

export function FeedCoverImage({ src, alt, className, ...props }: FeedCoverImageProps) {
  const initial = src?.trim() || FEED_FALLBACK_COVER;
  const [currentSrc, setCurrentSrc] = useState(initial);

  useEffect(() => {
    setCurrentSrc(src?.trim() || FEED_FALLBACK_COVER);
  }, [src]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      className={cn(className)}
      onError={() => {
        if (currentSrc !== FEED_FALLBACK_COVER) {
          setCurrentSrc(FEED_FALLBACK_COVER);
        }
      }}
    />
  );
}

export function FeedCoverBackground({
  src,
  className
}: {
  src?: string | null;
  className?: string;
}) {
  const initial = src?.trim() || FEED_FALLBACK_COVER;
  const [currentSrc, setCurrentSrc] = useState(initial);

  useEffect(() => {
    setCurrentSrc(src?.trim() || FEED_FALLBACK_COVER);
  }, [src]);

  return (
    <div
      className={className}
      style={{ backgroundImage: `url(${currentSrc})` }}
      role="img"
      aria-hidden
    >
      {/* Preload to detect broken URLs */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt=""
        className="hidden"
        onError={() => {
          if (currentSrc !== FEED_FALLBACK_COVER) {
            setCurrentSrc(FEED_FALLBACK_COVER);
          }
        }}
      />
    </div>
  );
}
