'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';

interface EventVenueMapSectionProps {
  venueMapUrl: string;
}

export function EventVenueMapSection({ venueMapUrl }: EventVenueMapSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 className="text-lg font-bold">Etkinlik Haritası</h2>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative w-full overflow-hidden rounded-xl border border-border bg-muted/20 transition-opacity hover:opacity-90"
          >
            <Image
              src={venueMapUrl}
              alt="Etkinlik haritası / oturma düzeni"
              width={800}
              height={500}
              className="w-full object-contain max-h-72"
              unoptimized
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-xl">
              <span className="flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm font-medium shadow">
                <ZoomIn className="size-4" />
                Büyüt
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* Fullscreen Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg hover:bg-background"
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-5xl w-full overflow-auto rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={venueMapUrl}
              alt="Etkinlik haritası / oturma düzeni"
              width={1200}
              height={800}
              className="w-full h-auto"
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  );
}
