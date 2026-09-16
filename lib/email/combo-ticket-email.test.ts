import { describe, expect, it } from 'vitest';
import { buildInvitationEmail, buildInvitationPlainText } from '@/lib/email/invitation-template';
import { buildTicketPurchaseEmail } from '@/lib/email/ticket-purchase-template';

const qr = 'https://biletfeed.com/api/tickets/qr?code=BF-111&token=tok&id=id-1';

describe('kombine e-posta kartları', () => {
  it('davetiye mailinde kombine tek QR ve gün notu görünür', () => {
    const html = buildInvitationEmail({
      guestName: 'Ercan',
      eventTitle: 'Konser Kombine',
      eventDate: '3 Ekim 2026 · 4 Ekim 2026',
      eventTime: '21:00',
      eventVenue: 'Mekan',
      eventCity: 'İstanbul',
      coverImage: '',
      ticketTypeName: 'Kombine',
      ticketCode: 'BF-111',
      qrDataUrl: qr,
      inviteUrl: 'https://biletfeed.com/davetiye/token',
      isComboPass: true,
      ticketCards: [
        {
          eventTitle: 'Konser Kombine',
          eventDate: 'Cumartesi, 3 Ekim 2026 · Pazar, 4 Ekim 2026',
          eventTime: '21:00',
          eventVenue: 'Mekan',
          eventCity: 'İstanbul',
          ticketTypeName: 'Kombine',
          ticketCode: 'BF-111',
          qrDataUrl: qr,
          qrHref: 'https://biletfeed.com/bilet/BF-111?token=tok&id=id-1'
        }
      ]
    });

    expect(html).toContain('BF-111');
    expect(html).toContain('tek QR');
    expect(html).toContain('her konser gününde');
    expect(html).toContain('/api/tickets/qr?');
    expect(html).not.toContain('data:image/png');
    expect(html).not.toContain('her gün için ayrı bilet');
  });

  it('davetiye düz metinde tek bilet kodu ve kombine notu vardır', () => {
    const text = buildInvitationPlainText({
      guestName: 'Ercan',
      eventTitle: 'Konser',
      eventDate: '3 Ekim · 4 Ekim',
      eventTime: '21:00',
      eventVenue: 'Mekan',
      eventCity: 'İstanbul',
      ticketCode: 'BF-111',
      inviteUrl: 'https://biletfeed.com/davetiye/token',
      isComboPass: true,
      ticketLines: [{ date: '3 Ekim · 4 Ekim', code: 'BF-111' }]
    });
    expect(text).toContain('BF-111');
    expect(text).toContain('tek QR');
    expect(text).not.toContain('BF-222');
  });

  it('satın alma mailinde kombine tek QR kartı vardır', () => {
    const html = buildTicketPurchaseEmail({
      customerName: 'Ercan',
      eventTitle: 'Konser Kombine',
      eventDate: '3 Ekim 2026 · 4 Ekim 2026',
      eventTime: '21:00',
      eventVenue: 'Mekan',
      eventCity: 'İstanbul',
      coverImage: '',
      organizerName: 'Org',
      orderNumber: 'ABC123',
      totalLabel: '₺1000',
      ticketLines: [{ name: 'Kombine', quantity: 1, unitPrice: '₺1000' }],
      ticketCodes: ['BF-111'],
      qrDataUrl: qr,
      ticketsUrl: 'https://biletfeed.com/biletlerim',
      eventUrl: 'https://biletfeed.com/etkinlik/konser',
      isComboPass: true,
      ticketCards: [
        {
          eventTitle: 'Konser Kombine',
          eventDate: '3 Ekim 2026 · 4 Ekim 2026',
          eventTime: '21:00',
          eventVenue: 'Mekan',
          eventCity: 'İstanbul',
          ticketTypeName: 'Kombine',
          holderName: 'Ercan',
          ticketCode: 'BF-111',
          qrDataUrl: qr
        }
      ]
    });

    expect(html).toContain('BF-111');
    expect(html).toContain('tek QR');
    expect(html).toContain('her konser gününde');
    expect(html).not.toContain('her gün için ayrı QR');
    expect(html).not.toContain('Diğer bilet kodları');
  });
});
