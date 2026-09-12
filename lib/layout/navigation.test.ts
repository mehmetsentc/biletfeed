import { describe, expect, it } from 'vitest';
import {
  shouldHideBottomNav,
  shouldHideSiteFooter,
  shouldHideSiteHeader
} from '@/lib/layout/navigation';

describe('davetiye / bilet odak ekranı', () => {
  it('davetiye sayfasında site menüsü ve alt bar gizlenir', () => {
    expect(shouldHideSiteHeader('/davetiye/abc')).toBe(true);
    expect(shouldHideBottomNav('/davetiye/abc')).toBe(true);
    expect(shouldHideSiteFooter('/davetiye/abc')).toBe(true);
  });

  it('Biletlerim menüsü kapanmaz', () => {
    expect(shouldHideSiteHeader('/biletlerim')).toBe(false);
    expect(shouldHideBottomNav('/biletlerim')).toBe(false);
  });
});
