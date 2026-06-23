'use client';

import { NewsletterForm } from '@/components/footer/newsletter-form';

export function NewsletterBanner() {
  return (
    <section className="bg-primary py-10 text-primary-foreground">
      <div className="container mx-auto flex flex-col items-start justify-between gap-6 px-4 md:flex-row md:items-center">
        <div className="max-w-lg">
          <h3 className="text-xl font-bold text-[#1a1d23] md:text-2xl">
            Bültenimize abone olun
          </h3>
          <p className="mt-2 text-sm text-[#1a1d23]/80 md:text-base">
            Haftalık bültenimizle favori organizatörlerinizden ve mekanlardan
            yeni etkinlik güncellemelerini alın.
          </p>
        </div>
        <NewsletterForm variant="figma" />
      </div>
    </section>
  );
}
