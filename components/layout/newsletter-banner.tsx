'use client';

import { useEffect, useState } from 'react';
import { NewsletterForm } from '@/components/footer/newsletter-form';
import { useTranslations } from '@/components/providers';

const STORAGE_KEY = 'bf_newsletter_subscribed';

export function NewsletterBanner() {
  const t = useTranslations();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    setSubscribed(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  // localStorage henüz kontrol edilmedi (SSR) veya zaten abone → gösterme
  if (subscribed !== false) return null;

  function handleSubscribed() {
    localStorage.setItem(STORAGE_KEY, '1');
    setSubscribed(true);
  }

  return (
    <section className="bg-primary py-10 text-primary-foreground">
      <div className="container mx-auto flex flex-col items-start justify-between gap-6 px-4 md:flex-row md:items-center">
        <div className="max-w-lg">
          <h3 className="text-xl font-bold text-[#1a1d23] md:text-2xl">
            {t.home.newsletterTitle}
          </h3>
          <p className="mt-2 text-sm text-[#1a1d23]/80 md:text-base">
            {t.home.newsletterSubtitle}
          </p>
        </div>
        <NewsletterForm variant="figma" onSubscribed={handleSubscribed} />
      </div>
    </section>
  );
}
