'use client';

import Image from 'next/image';

type EventGallerySectionProps = {
  images: string[];
  title?: string;
};

export function EventGallerySection({
  images,
  title = 'Galeri'
}: EventGallerySectionProps) {
  const urls = images.filter((u) => u.trim().startsWith('http')).slice(0, 4);
  if (urls.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {urls.map((src) => (
          <div
            key={src}
            className="relative aspect-video overflow-hidden rounded-xl bg-muted"
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
