import Link from 'next/link';
import { getCitySeoContent, isCitySeoSupported } from '@/lib/seo/city-seo-content';
import { getCityNameOrDefault } from '@/lib/location/cities';

type CityEventsSeoSectionProps = {
  citySlug: string;
};

export function CityEventsSeoSection({ citySlug }: CityEventsSeoSectionProps) {
  if (!isCitySeoSupported(citySlug)) return null;

  const content = getCitySeoContent(citySlug);
  const cityName = getCityNameOrDefault(citySlug);

  return (
    <section
      className="border-t border-white/10 bg-[#0f1419]"
      aria-labelledby="city-seo-heading"
    >
      <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
        <h2
          id="city-seo-heading"
          className="text-xl font-bold leading-snug text-white md:text-2xl"
        >
          {content.headline}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base">
          {content.intro}
        </p>

        <div className="mt-8 space-y-8">
          {content.sections.map((section) => (
            <article key={section.title}>
              <h3 className="text-base font-semibold text-white md:text-lg">
                {section.title}
              </h3>
              {section.paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="mt-3 text-sm leading-relaxed text-white/65 md:text-[15px]"
                >
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-white/50">
          <Link
            href={`/${citySlug}-etkinlikleri`}
            className="font-medium text-[var(--bf-accent-ink)] hover:underline"
          >
            {cityName} etkinlikleri
          </Link>
          {' · '}
          <Link href="/etkinlikler" className="hover:text-[var(--bf-accent-ink)] hover:underline">
            Tüm etkinlikler
          </Link>
          {' · '}
          <Link href="/kategoriler" className="hover:text-[var(--bf-accent-ink)] hover:underline">
            Kategoriler
          </Link>
        </p>
      </div>
    </section>
  );
}
