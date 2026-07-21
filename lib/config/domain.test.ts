import { describe, expect, it } from 'vitest';
import {
  getAdminUrl,
  getGirisUrl,
  isDestekAppPath,
  normalizeAdminPath,
  normalizeSupportPath
} from './domain';

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

describe('subdomain URL helpers', () => {
  it('uses configured gate and admin URL overrides', () => {
    const previousGiris = process.env.NEXT_PUBLIC_GIRIS_URL;
    const previousAdmin = process.env.NEXT_PUBLIC_ADMIN_URL;
    process.env.NEXT_PUBLIC_GIRIS_URL = 'https://gate.example.com/';
    process.env.NEXT_PUBLIC_ADMIN_URL = 'https://ops.example.com/';

    expect(getGirisUrl('/tarayici')).toBe('https://gate.example.com/tarayici');
    expect(getAdminUrl('/admin/etkinlikler')).toBe(
      'https://ops.example.com/etkinlikler'
    );

    if (previousGiris === undefined) delete process.env.NEXT_PUBLIC_GIRIS_URL;
    else process.env.NEXT_PUBLIC_GIRIS_URL = previousGiris;
    if (previousAdmin === undefined) delete process.env.NEXT_PUBLIC_ADMIN_URL;
    else process.env.NEXT_PUBLIC_ADMIN_URL = previousAdmin;
  });

  it('normalizes internal admin paths for the clean admin host', () => {
    expect(normalizeAdminPath('/admin')).toBe('/');
    expect(normalizeAdminPath('/admin/muhasebe')).toBe('/muhasebe');
    expect(normalizeAdminPath('/etkinlikler')).toBe('/etkinlikler');
  });
});
