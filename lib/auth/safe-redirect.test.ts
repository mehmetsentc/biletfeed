import { afterEach, describe, expect, it } from 'vitest';
import {
  isTrustedBiletFeedHost,
  sanitizeRedirectPath
} from './safe-redirect';

const ORIGINAL_CANONICAL = process.env.NEXT_PUBLIC_CANONICAL_HOST;
const ORIGINAL_ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

afterEach(() => {
  if (ORIGINAL_CANONICAL === undefined) {
    delete process.env.NEXT_PUBLIC_CANONICAL_HOST;
  } else {
    process.env.NEXT_PUBLIC_CANONICAL_HOST = ORIGINAL_CANONICAL;
  }
  if (ORIGINAL_ROOT === undefined) {
    delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  } else {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = ORIGINAL_ROOT;
  }
});

describe('sanitizeRedirectPath', () => {
  it('allows safe relative paths', () => {
    expect(sanitizeRedirectPath('/profil/destek')).toBe('/profil/destek');
  });

  it('rejects protocol-relative and external URLs', () => {
    expect(sanitizeRedirectPath('//evil.com')).toBe('/');
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/');
  });

  it('allows trusted cross-subdomain URLs when host is configured', () => {
    process.env.NEXT_PUBLIC_CANONICAL_HOST = 'biletfeed.com';
    expect(
      sanitizeRedirectPath('https://destek.biletfeed.com/destek-talebi')
    ).toBe('https://destek.biletfeed.com/destek-talebi');
  });

  it('falls back when redirect is empty', () => {
    expect(sanitizeRedirectPath(null, '/giris')).toBe('/giris');
  });
});

describe('isTrustedBiletFeedHost', () => {
  it('accepts localhost subdomains in development', () => {
    expect(isTrustedBiletFeedHost('destek.localhost')).toBe(true);
    expect(isTrustedBiletFeedHost('panel.localhost')).toBe(true);
  });

  it('accepts production root and destek subdomain', () => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'biletfeed.com';
    expect(isTrustedBiletFeedHost('biletfeed.com')).toBe(true);
    expect(isTrustedBiletFeedHost('destek.biletfeed.com')).toBe(true);
    expect(isTrustedBiletFeedHost('evil.com')).toBe(false);
  });
});
