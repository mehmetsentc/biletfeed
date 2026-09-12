import { describe, expect, it } from 'vitest';
import {
  buildPublicTicketPageUrl,
  buildTicketQrImageUrl
} from '@/lib/tickets/qr-image-url';

describe('email QR URL', () => {
  it('HTTPS görsel üretir, data URI değil', () => {
    const url = buildTicketQrImageUrl({
      ticketCode: 'BF-111',
      validationToken: 'tok',
      ticketId: 'id-1'
    });
    expect(url).toContain('/api/tickets/qr?');
    expect(url).toContain('code=BF-111');
    expect(url.startsWith('data:')).toBe(false);
  });

  it('bilet sayfası bağlantısı token içerir', () => {
    const url = buildPublicTicketPageUrl({
      ticketCode: 'BF-111',
      validationToken: 'tok',
      ticketId: 'id-1'
    });
    expect(url).toContain('/bilet/BF-111');
    expect(url).toContain('token=tok');
    expect(url).toContain('id=id-1');
  });
});
