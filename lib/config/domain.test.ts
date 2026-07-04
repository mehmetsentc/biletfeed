import { describe, expect, it } from 'vitest';
import { isDestekAppPath, normalizeSupportPath } from './domain';

describe('normalizeSupportPath', () => {
  it('strips /destek prefix only for destek app routes', () => {
    expect(normalizeSupportPath('/destek/kategori/sss')).toBe('/kategori/sss');
    expect(normalizeSupportPath('/destek')).toBe('/');
  });

  it('preserves /destek-talebi path', () => {
    expect(normalizeSupportPath('/destek-talebi')).toBe('/destek-talebi');
  });
});

describe('isDestekAppPath', () => {
  it('matches destek center routes but not destek-talebi', () => {
    expect(isDestekAppPath('/destek')).toBe(true);
    expect(isDestekAppPath('/destek/kategori/sss')).toBe(true);
    expect(isDestekAppPath('/destek-talebi')).toBe(false);
  });
});
