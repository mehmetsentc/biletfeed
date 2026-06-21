import { HeroSearch } from '@/components/events/hero-search';

/** Telefon — kompakt, arama odaklı */
export function EventsHeroMobile() {
  return (
    <section className="bg-[#1a1d23] px-4 py-6 md:hidden">
      <h1 className="text-xl font-extrabold leading-tight text-white">
        Etkinlikleri keşfet
      </h1>
      <p className="mt-1.5 text-sm text-white/70">
        Şehrinde ve online etkinlikler
      </p>
      <div className="mt-4">
        <HeroSearch variant="figma" />
      </div>
    </section>
  );
}

/** Tablet — orta boy hero */
export function EventsHeroTablet() {
  return (
    <section className="hidden bg-[#1a1d23] px-6 py-10 md:block lg:hidden">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold leading-tight text-white">
          Etkinlik dünyasını keşfedin
        </h1>
        <p className="mt-2 text-base text-white/75">
          Sizi heyecanlandıran etkinliği bulun
        </p>
        <div className="mt-6">
          <HeroSearch variant="figma" />
        </div>
      </div>
    </section>
  );
}

/** Masaüstü — geniş, merkezi hero */
export function EventsHeroDesktop() {
  return (
    <section className="hidden bg-[#1a1d23] py-16 lg:block">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Etkinlik dünyasını keşfedin. Sizi heyecanlandıranı bulun!
          </h1>
          <div className="mt-8">
            <HeroSearch variant="figma" />
          </div>
        </div>
      </div>
    </section>
  );
}
