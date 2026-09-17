import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HERO_EVENT_SLUGS,
  pickDefaultHeroEvents
} from '@/lib/services/home-hero-slides';

describe('pickDefaultHeroEvents', () => {
  it('BLOK3 ve Zeynep’i tarih sırasıyla döner', () => {
    const picked = pickDefaultHeroEvents([
      { slug: 'zeynep-bastik-emir-can-igrek-koseri' },
      { slug: 'blok3-konseri' },
      { slug: 'baska-konser' }
    ]);

    expect(picked.map((event) => event.slug)).toEqual([...DEFAULT_HERO_EVENT_SLUGS]);
  });

  it('tükenen etkinliği atlar, diğerini bırakır', () => {
    const picked = pickDefaultHeroEvents([
      { slug: 'blok3-konseri', isSoldOut: true },
      { slug: 'zeynep-bastik-emir-can-igrek-koseri', isSoldOut: false }
    ]);

    expect(picked.map((event) => event.slug)).toEqual([
      'zeynep-bastik-emir-can-igrek-koseri'
    ]);
  });

  it('listede olmayan slug’ı atlar', () => {
    const picked = pickDefaultHeroEvents([{ slug: 'blok3-konseri' }]);
    expect(picked.map((event) => event.slug)).toEqual(['blok3-konseri']);
  });
});
