import { describe, expect, it } from 'vitest';
import { buildInvitationEmail, buildInvitationPlainText } from '@/lib/email/invitation-template';
import { buildTicketPurchaseEmail } from '@/lib/email/ticket-purchase-template';

const qr = 'https://biletfeed.com/api/tickets/qr?code=BF-111&token=tok&id=id-1';
const qr2 = 'https://biletfeed.com/api/tickets/qr?code=BF-222&token=tok&id=id-2';

describe('kombine e-posta kartları', () => {
  it('davetiye mailinde her günün kodu ayrı kartta görünür', () => {
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
      ticketCards: [
        {
          eventTitle: 'Konser 3 Ekim',
          eventDate: 'Cumartesi, 3 Ekim 2026',
          eventTime: '21:00',
          eventVenue: 'Mekan',
          eventCity: 'İstanbul',
          ticketTypeName: 'Kombine',
          ticketCode: 'BF-111',
          qrDataUrl: qr,
          qrHref: 'https://biletfeed.com/bilet/BF-111?token=tok&id=id-1'
        },
        {
          eventTitle: 'Konser 4 Ekim',
          eventDate: 'Pazar, 4 Ekim 2026',
          eventTime: '21:00',
          eventVenue: 'Mekan',
          eventCity: 'İstanbul',
          ticketTypeName: 'Kombine',
          ticketCode: 'BF-222',
          qrDataUrl: qr2,
          qrHref: 'https://biletfeed.com/bilet/BF-222?token=tok&id=id-2'
        }
      ]
    });

    expect(html).toContain('BF-111');
    expect(html).toContain('BF-222');
    expect(html).toContain('her gün için ayrı bilet');
    expect(html).toContain('/api/tickets/qr?');
    expect(html).not.toContain('data:image/png');
  });

  it('davetiye düz metinde iki bilet kodunu listeler', () => {
    const text = buildInvitationPlainText({
      guestName: 'Ercan',
      eventTitle: 'Konser',
      eventDate: '3 Ekim · 4 Ekim',
      eventTime: '21:00',
      eventVenue: 'Mekan',
      eventCity: 'İstanbul',
      ticketCode: 'BF-111',
      inviteUrl: 'https://biletfeed.com/davetiye/token',
      ticketLines: [
        { date: '3 Ekim', code: 'BF-111' },
        { date: '4 Ekim', code: 'BF-222' }
      ]
    });
    expect(text).toContain('BF-111');
    expect(text).toContain('BF-222');
  });

  it('satın alma mailinde her günün QR kartı vardır', () => {
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
      ticketCodes: ['BF-111', 'BF-222'],
      qrDataUrl: qr,
      ticketsUrl: 'https://biletfeed.com/biletlerim',
      eventUrl: 'https://biletfeed.com/etkinlik/konser',
      ticketCards: [
        {
          eventTitle: 'Konser 3 Ekim',
          eventDate: 'Cumartesi, 3 Ekim 2026',
          eventTime: '21:00',
          eventVenue: 'Mekan',
          eventCity: 'İstanbul',
          ticketTypeName: 'Kombine',
          holderName: 'Ercan',
          ticketCode: 'BF-111',
          qrDataUrl: qr
        },
        {
          eventTitle: 'Konser 4 Ekim',
          eventDate: 'Pazar, 4 Ekim 2026',
          eventTime: '21:00',
          eventVenue: 'Mekan',
          eventCity: 'İstanbul',
          ticketTypeName: 'Kombine',
          holderName: 'Ercan',
          ticketCode: 'BF-222',
          qrDataUrl: qr
        }
      ]
    });

    expect(html).toContain('BF-111');
    expect(html).toContain('BF-222');
    expect(html).toContain('her gün için ayrı QR');
    expect(html).not.toContain('Diğer bilet kodları');
  });
});
