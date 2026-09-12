import { describe, expect, it } from 'vitest';
import { shouldRejectQrToken } from '@/lib/tickets/qr-token-policy';
import {
  generateValidationToken,
  normalizeTicketCode,
  parseQrPayload,
  resolveManualScanInput,
  verifyValidationToken
} from '@/lib/tickets/sign';
import { parseSeatsProviderRef, normalizeSeatUnitId } from '@/lib/tickets/seat-hold';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import {
  assertSafePublicImageUrl,
  isAllowedMapImageHost,
  isPrivateHostname
} from '@/lib/security/safe-url';
import { NextRequest } from 'next/server';

describe('qr-token-policy', () => {
  it('manuel BF kodunda token yoksa reddetmez', () => {
    expect(
      shouldRejectQrToken({ hasValidationToken: false, tokenValid: false })
    ).toBe(false);
  });

  it('QR HMAC yanlışsa reddeder', () => {
    expect(
      shouldRejectQrToken({ hasValidationToken: true, tokenValid: false })
    ).toBe(true);
  });

  it('doğru HMAC kabul edilir', () => {
    expect(
      shouldRejectQrToken({ hasValidationToken: true, tokenValid: true })
    ).toBe(false);
  });
});

describe('ticket sign', () => {
  it('HMAC doğrular ve timing-safe karşılaştırır', () => {
    const token = generateValidationToken('tid', 'eid', 'nonce');
    expect(verifyValidationToken('tid', 'eid', token, 'nonce')).toBe(true);
    expect(verifyValidationToken('tid', 'eid', token, 'other')).toBe(false);
    expect(verifyValidationToken('tid', 'eid', 'aa', 'nonce')).toBe(false);
  });

  it('QR URL’den kod ve token çıkarır', () => {
    const parsed = parseQrPayload(
      'https://biletfeed.com/bilet/BF-ABC123?token=deadbeef&id=ticket-1'
    );
    expect(parsed.ticketCode).toBe('BF-ABC123');
    expect(parsed.validationToken).toBe('deadbeef');
    expect(parsed.ticketId).toBe('ticket-1');
  });

  it('manuel BF kodunu normalize eder', () => {
    expect(normalizeTicketCode('bf-aa11')).toBe('BF-AA11');
    expect(resolveManualScanInput('BF-AA11').ticketCode).toBe('BF-AA11');
  });
});

describe('seat-hold helpers', () => {
  it('providerRef koltuk listesini parse eder', () => {
    expect(parseSeatsProviderRef('seats:A1, a1, B2')).toEqual(['A1', 'B2']);
    expect(parseSeatsProviderRef('pay_123')).toEqual([]);
  });

  it('koltuk id büyük harfe çevirir', () => {
    expect(normalizeSeatUnitId(' vip-e11 ')).toBe('VIP-E11');
  });
});

describe('csrf', () => {
  function req(headers: Record<string, string>) {
    return new NextRequest('https://biletfeed.com/api/tickets/validate', {
      method: 'POST',
      headers
    });
  }

  it('eşleşen Origin kabul eder', () => {
    expect(
      isSameOriginRequest(
        req({
          host: 'biletfeed.com',
          origin: 'https://biletfeed.com'
        })
      )
    ).toBe(true);
  });

  it('Origin: null ile Host-only isteği reddeder', () => {
    expect(
      isSameOriginRequest(
        req({
          host: 'biletfeed.com',
          origin: 'null'
        })
      )
    ).toBe(false);
  });

  it('Sec-Fetch-Site: none tek başına yetmez', () => {
    expect(
      isSameOriginRequest(
        req({
          host: 'biletfeed.com',
          'sec-fetch-site': 'none'
        })
      )
    ).toBe(false);
  });

  it('same-origin fetch metadata kabul eder', () => {
    expect(
      isSameOriginRequest(
        req({
          host: 'biletfeed.com',
          'sec-fetch-site': 'same-origin'
        })
      )
    ).toBe(true);
  });
});

describe('safe-url SSRF', () => {
  it('özel IP ve metadata hostlarını reddeder', () => {
    expect(isPrivateHostname('127.0.0.1')).toBe(true);
    expect(isPrivateHostname('169.254.169.254')).toBe(true);
    expect(isPrivateHostname('metadata.google.internal')).toBe(true);
    expect(isAllowedMapImageHost('169.254.169.254')).toBe(false);
  });

  it('Firebase Storage HTTPS kabul eder', () => {
    const url = assertSafePublicImageUrl(
      'https://firebasestorage.googleapis.com/v0/b/bucket/o/map.png'
    );
    expect(url.hostname).toBe('firebasestorage.googleapis.com');
  });

  it('iç ağ URL’sini reddeder', () => {
    expect(() => assertSafePublicImageUrl('http://127.0.0.1/secret')).toThrow();
    expect(() =>
      assertSafePublicImageUrl('https://169.254.169.254/latest/meta-data')
    ).toThrow();
  });
});
