import Image from 'next/image';
import { HeroSearch } from '@/components/events/hero-search';

/** Telefon */
export function HomeHeroMobile() {
  return (
    <section className="relative overflow-hidden bg-[#1a1d23] md:hidden">
      <Image
        src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80"
        alt=""
        fill
        priority
        className="object-cover opacity-35"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1d23]/90 via-[#1a1d23]/75 to-[#1a1d23]" />

      <div className="relative px-4 pb-6 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Bilet Feed
        </p>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight text-white">
          Canlı etkinlikleri keşfet
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/75">
          Konser, tiyatro, festival — şehrinde ve online.
        </p>
      </div>
    </section>
  );
}

/** Tablet */
export function HomeHeroTablet() {
  return (
    <section className="relative hidden min-h-[420px] overflow-hidden bg-[#1a1d23] md:block lg:hidden">
      <Image
        src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80"
        alt=""
        fill
        priority
        className="object-cover opacity-38"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a1d23]/95 via-[#1a1d23]/70 to-[#1a1d23]/50" />

      <div className="container relative mx-auto flex min-h-[420px] items-center px-6 py-12">
        <div className="max-w-lg">
          <p className="text-sm font-medium text-primary">Kaçırmayın!</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-white">
            Yakınınızdaki{' '}
            <span className="text-primary">canlı etkinlikleri</span> keşfedin
          </h1>
          <div className="mt-7">
            <HeroSearch variant="figma" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Masaüstü */
export function HomeHeroDesktop() {
  return (
    <section className="relative hidden min-h-[560px] items-center overflow-hidden bg-[#1a1d23] lg:flex">
      <Image
        src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80"
        alt=""
        fill
        priority
        className="object-cover opacity-40"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1d23]/80 via-[#1a1d23]/60 to-[#1a1d23]/90" />

      <div className="container relative mx-auto px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-lg font-medium text-white/90">Kaçırmayın!</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight text-white lg:text-6xl">
            Yakınınızdaki ve dünya çapındaki{' '}
            <span className="text-primary">canlı etkinlikleri</span> keşfedin.
          </h1>
          <div className="mt-10">
            <HeroSearch variant="figma" />
          </div>
        </div>
      </div>
    </section>
  );
}
