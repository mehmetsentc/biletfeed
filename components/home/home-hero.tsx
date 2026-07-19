import Image from 'next/image';
import { HeroSearch } from '@/components/events/hero-search';

/** Telefon */
export function HomeHeroMobile() {
  return (
    <section className="relative overflow-hidden bg-[#000000] md:hidden">
      <Image
        src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80"
        alt=""
        fill
        priority
        className="animate-hero-ken-burns object-cover opacity-35"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/92 via-[#000000]/72 to-[#000000]" />

      <div className="relative px-4 pb-8 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--bf-accent-ink)]">
          Bilet Feed
        </p>
        <h1 className="mt-2 max-w-[16rem] text-2xl font-extrabold leading-[1.2] tracking-tight text-white">
          Canlı etkinlikleri keşfet
        </h1>
        <p className="mt-2 max-w-xs text-sm font-medium leading-relaxed text-white/80">
          Konser, tiyatro, festival — şehrinde ve online.
        </p>
      </div>
    </section>
  );
}

/** Tablet */
export function HomeHeroTablet() {
  return (
    <section className="relative hidden min-h-[420px] overflow-hidden bg-[#000000] md:block lg:hidden">
      <Image
        src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80"
        alt=""
        fill
        priority
        className="animate-hero-ken-burns object-cover opacity-38"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/96 via-[#000000]/72 to-[#000000]/45" />

      <div className="container relative mx-auto flex min-h-[420px] items-center px-6 py-14">
        <div className="max-w-lg">
          <p className="text-sm font-semibold text-[var(--bf-accent-ink)]">Kaçırmayın!</p>
          <h1 className="mt-3 max-w-md text-4xl font-extrabold leading-[1.15] tracking-tight text-white">
            Yakınınızdaki{' '}
            <span className="text-[var(--bf-accent-ink)]">canlı etkinlikleri</span> keşfedin
          </h1>
          <div className="mt-8">
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
    <section className="relative hidden min-h-[560px] items-center overflow-hidden bg-[#000000] lg:flex">
      <Image
        src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80"
        alt=""
        fill
        priority
        className="animate-hero-ken-burns object-cover opacity-40"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/85 via-[#000000]/55 to-[#000000]/92" />

      <div className="container relative mx-auto px-4 py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-lg font-semibold text-white/90">Kaçırmayın!</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-extrabold leading-[1.12] tracking-tight text-white lg:text-6xl">
            Yakınınızdaki ve dünya çapındaki{' '}
            <span className="text-[var(--bf-accent-ink)]">canlı etkinlikleri</span> keşfedin.
          </h1>
          <div className="mt-12">
            <HeroSearch variant="figma" />
          </div>
        </div>
      </div>
    </section>
  );
}
