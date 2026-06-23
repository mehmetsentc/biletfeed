'use client';

import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CookieConsentBanner({
  onAccept,
  onReject,
  onOpenPreferences
}: {
  onAccept: () => void;
  onReject: () => void;
  onOpenPreferences: () => void;
}) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:p-4"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] md:flex-row md:items-center md:gap-6 md:p-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
            <Cookie className="size-5 text-zinc-600" aria-hidden />
          </div>
          <div className="min-w-0">
            <p
              id="cookie-consent-title"
              className="text-sm font-semibold text-zinc-800 md:text-base"
            >
              Sana özel bir deneyim için çalışıyoruz
            </p>
            <p
              id="cookie-consent-desc"
              className="mt-1.5 text-xs leading-relaxed text-zinc-600 md:text-sm"
            >
              Deneyiminizi iyileştirmek için çerezler kullanıyoruz. Gerekli çerezler
              hizmet sunumu için, diğerleri ise yalnızca izninizle kullanılır.{' '}
              <button
                type="button"
                onClick={onReject}
                className="font-medium text-zinc-800 underline underline-offset-2 hover:text-zinc-950"
              >
                Reddet
              </button>{' '}
              seçeneğiyle yalnızca zorunlu çerezlerle devam edebilirsiniz. Detaylara{' '}
              <Link
                href="/cerezler"
                className="font-medium text-zinc-800 underline underline-offset-2 hover:text-zinc-950"
              >
                Çerez Politikası
              </Link>{' '}
              ve{' '}
              <button
                type="button"
                onClick={onOpenPreferences}
                className="font-medium text-zinc-800 underline underline-offset-2 hover:text-zinc-950"
              >
                Tercihler
              </button>
              &apos;den ulaşabilirsiniz.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={onAccept}
          className="h-11 shrink-0 rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground hover:bg-primary/90 md:min-w-[140px]"
        >
          Kabul Et
        </Button>
      </div>
    </div>
  );
}
