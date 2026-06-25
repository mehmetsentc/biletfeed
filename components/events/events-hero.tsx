import { HeroSearch } from '@/components/events/hero-search';

/** Telefon — mobil header'da zaten arama var, bu hero gizlendi */
export function EventsHeroMobile() {
  return null;
}

/** Tablet — orta boy hero */
export function EventsHeroTablet() {
  return (
    <section className="hidden border-b border-border bg-muted/30 px-6 py-8 md:block lg:hidden">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold leading-tight text-foreground">
          Etkinlik dünyasını keşfedin
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sizi heyecanlandıran etkinliği bulun
        </p>
        <div className="mt-5">
          <HeroSearch variant="figma" />
        </div>
      </div>
    </section>
  );
}

/** Masaüstü — geniş, merkezi hero */
export function EventsHeroDesktop() {
  return (
    <section className="hidden border-b border-border bg-muted/30 py-12 lg:block">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight text-foreground">
            Etkinlik dünyasını keşfedin
          </h1>
          <p className="mt-2 text-muted-foreground">Sizi heyecanlandıranı bulun!</p>
          <div className="mt-6">
            <HeroSearch variant="figma" />
          </div>
        </div>
      </div>
    </section>
  );
}
