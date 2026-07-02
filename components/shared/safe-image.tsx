'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

type SafeImageProps = Omit<ImageProps, 'onError'> & {
  fallback: React.ReactNode;
};

/** Broken remote URLs için fallback gösterir */
export function SafeImage({
  fallback,
  className,
  alt,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={cn('flex size-full items-center justify-center', className)}>
        {fallback}
      </div>
    );
  }

  return (
    <Image
      {...props}
      alt={alt}
      className={className}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
