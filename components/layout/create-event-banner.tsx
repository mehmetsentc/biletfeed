'use client';

import Link from 'next/link';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useTranslations } from '@/components/providers';
import { panelHref } from '@/lib/config/domain';

/** Ana sayfa CTA — giriş yapmış tüm kullanıcılara. */
export function CreateEventBanner() {
  const { user } = useAuth();
  const t = useTranslations();

  if (!user) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-black py-14 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <svg className="size-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path
            d="M0 100 Q300 20 600 100 T1200 100"
            fill="none"
            stroke="var(--bf-orange)"
            strokeWidth="2"
          />
          <path
            d="M0 140 Q400 60 800 140 T1200 120"
            fill="none"
            stroke="var(--bf-orange)"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className="container relative mx-auto flex flex-col items-center gap-8 px-4 md:flex-row md:justify-between">
        <div className="max-w-xl text-center md:text-left">
          <h2 className="text-2xl font-bold text-[var(--bf-accent-ink)] md:text-3xl">
            {t.home.createEventTitle}
          </h2>
          <p className="mt-3 text-sm text-white/80 md:text-base">
            {t.home.createEventSubtitle}
          </p>
        </div>
        <Link href={panelHref('/organizator-panel/etkinlik/yeni')}>
          <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90">
            <CalendarPlus className="size-5" />
            {t.chrome.createEvent}
            <ArrowRight className="size-4" />
          </span>
        </Link>
      </div>
    </section>
  );
}
