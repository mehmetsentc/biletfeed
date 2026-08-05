'use client';

import Image from 'next/image';
import { IMAGE_SPECS } from '@/lib/config/image-dimensions';

type EventSponsorBandProps = {
  imageUrl: string;
  alt?: string;
};

/** Brief: 580×60 sponsor bandı */
export function EventSponsorBand({
  imageUrl,
  alt = 'Sponsor'
}: EventSponsorBandProps) {
  if (!imageUrl.trim().startsWith('http')) return null;
  const { width, height } = IMAGE_SPECS.sponsorBand;

  return (
    <div className="flex justify-center rounded-xl border border-border bg-card px-4 py-3">
      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        className="h-[60px] w-auto max-w-full object-contain"
        unoptimized
      />
    </div>
  );
}
