import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { siteHref } from '@/lib/config/domain';

interface OrganizerAuthShellProps {
  children: React.ReactNode;
}

export function OrganizerAuthShell({ children }: OrganizerAuthShellProps) {
  return (
    <div className="grid min-h-screen bg-[#0c1017] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <Image
          src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1017]/95 via-[#0c1017]/80 to-[#f5a623]/20" />
        <div className="relative z-10 flex flex-col justify-between p-10 text-white">
          <Logo href="/baslangic" variant="on-dark" />
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Organizatör Paneli
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
              Etkinliklerinizi yönetin
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/75">
              Bilet satışı, kapı taraması, davetiyeler ve raporlar — tek panelde.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-white/65">
              <li>✓ Gerçek zamanlı satış takibi</li>
              <li>✓ QR bilet ve kapı kontrolü</li>
              <li>✓ Kupon ve davetiye yönetimi</li>
            </ul>
          </div>
          <p className="text-sm text-white/40">BiletFeed Organizatör</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-6 md:p-10">
        <div className="mb-8 lg:hidden">
          <Logo href="/baslangic" variant="on-dark" />
        </div>
        <div className="w-full max-w-md">{children}</div>
        <p className="mt-8 text-center text-sm text-white/50 lg:hidden">
          <Link
            href={siteHref('/')}
            className="underline-offset-4 hover:text-primary hover:underline"
          >
            BiletFeed ana siteye dön
          </Link>
        </p>
      </div>
    </div>
  );
}
