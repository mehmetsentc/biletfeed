import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { Logo } from '@/components/brand/logo';
import { ScannerGateLoginForm } from '@/components/auth/scanner-gate-login-form';
import { siteHref } from '@/lib/config/domain';

export const metadata: Metadata = {
  title: 'Kapı Girişi | BiletFeed',
  description: 'Etkinlik kapısında bilet taraması için giriş yapın'
};

export default function GirisTerminalPage() {
  return (
    <div className="grid min-h-screen bg-[#0c1017] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <Image
          src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1017]/95 via-[#0c1017]/80 to-[#f5a623]/25" />
        <div className="relative z-10 flex flex-col justify-between p-10 text-white">
          <Logo href={siteHref('/')} variant="on-dark" />
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Kapı Terminali
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              Biletleri hızla okutun
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/75">
              Organizatörden aldığınız kapı kodu ile giriş yapın. Panel erişimi
              gerekmez — sadece tarama.
            </p>
          </div>
          <p className="text-xs text-white/40">giris.biletfeed.com</p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <Logo href={siteHref('/')} variant="on-dark" className="max-w-[140px]" />
        </div>
        <Suspense
          fallback={
            <div className="h-64 w-full max-w-md animate-pulse rounded-2xl bg-white/5" />
          }
        >
          <ScannerGateLoginForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-white/40">
          Organizatör müsünüz?{' '}
          <Link
            href={siteHref('/')}
            className="text-primary underline-offset-2 hover:underline"
          >
            Ana site
          </Link>
        </p>
      </div>
    </div>
  );
}
