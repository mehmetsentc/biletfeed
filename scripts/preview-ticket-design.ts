/**
 * Statik bilet tasarım önizlemesi — Next dev beklemeden tarayıcıda açılır.
 * Kullanım: npm run preview:ticket
 */
import fs from 'fs';
import path from 'path';
import { buildInvitationEmail } from '@/lib/email/invitation-template';
import { buildTicketPurchaseEmail } from '@/lib/email/ticket-purchase-template';
import { buildTicketReceiptEmailCard } from '@/lib/email/ticket-receipt-email';
import { ticketHeaderLogoSrc } from '@/lib/brand/embed-logo';
import { qrToDataUrl } from '@/lib/tickets/design/qr-data-url';

const MOCK = {
  eventTitle: 'MANIFEST',
  eventDate: 'Cuma, 30 Mayıs 2026',
  eventTime: '21:00',
  venue: 'Dido Beach (5 Nolu Lara Plajı)',
  city: 'Antalya',
  ticketTypeName: 'Genel Giriş Ayakta',
  holderName: 'Ahmet Yılmaz',
  ticketCode: 'BF-77720559',
  orderNumber: '344328',
  categoryLabel: 'Genel Giriş',
  sectorGate: 'Genel Giriş / Genel_Giris',
  personalMessage: 'Seni aramızda görmekten mutluluk duyarız!',
  inviteUrl: 'https://biletfeed.com/davetiye/ornek-token'
} as const;

async function main() {
  const outDir = path.join(process.cwd(), 'public/ticket-preview');
  fs.mkdirSync(outDir, { recursive: true });

  const qrInvite = await qrToDataUrl(MOCK.inviteUrl);
  const qrTicket = await qrToDataUrl(
    `https://biletfeed.com/bilet/${MOCK.ticketCode}?token=preview&id=preview`
  );

  const ticketCard = buildTicketReceiptEmailCard({
    kind: 'ticket',
    eventTitle: MOCK.eventTitle,
    eventDate: MOCK.eventDate,
    eventTime: MOCK.eventTime,
    venue: MOCK.venue,
    city: MOCK.city,
    ticketTypeName: MOCK.ticketTypeName,
    holderName: MOCK.holderName,
    ticketCode: MOCK.ticketCode,
    qrDataUrl: qrTicket,
    orderNumber: MOCK.orderNumber,
    categoryLabel: MOCK.categoryLabel,
    sectorGate: MOCK.sectorGate
  });

  const invitationCard = buildTicketReceiptEmailCard({
    kind: 'invitation',
    eventTitle: MOCK.eventTitle,
    eventDate: MOCK.eventDate,
    eventTime: MOCK.eventTime,
    venue: MOCK.venue,
    city: MOCK.city,
    ticketTypeName: MOCK.ticketTypeName,
    holderName: MOCK.holderName,
    ticketCode: MOCK.ticketCode,
    qrDataUrl: qrInvite,
    personalMessage: MOCK.personalMessage,
    categoryLabel: MOCK.categoryLabel,
    sectorGate: MOCK.sectorGate
  });

  fs.writeFileSync(path.join(outDir, 'purchase-email.html'), buildTicketPurchaseEmail({
    customerName: MOCK.holderName,
    eventTitle: MOCK.eventTitle,
    eventDate: MOCK.eventDate,
    eventTime: MOCK.eventTime,
    eventVenue: MOCK.venue,
    eventCity: MOCK.city,
    coverImage: '',
    organizerName: 'Let Us Event',
    orderNumber: MOCK.orderNumber,
    totalLabel: '₺450,00',
    ticketLines: [{ name: MOCK.ticketTypeName, quantity: 1, unitPrice: '₺450,00' }],
    ticketCodes: [MOCK.ticketCode],
    qrDataUrl: qrTicket,
    ticketsUrl: 'https://biletfeed.com/biletlerim',
    eventUrl: 'https://biletfeed.com/etkinlik/manifest'
  }), 'utf8');

  fs.writeFileSync(path.join(outDir, 'invitation-email.html'), buildInvitationEmail({
    guestName: MOCK.holderName,
    eventTitle: MOCK.eventTitle,
    eventDate: MOCK.eventDate,
    eventTime: MOCK.eventTime,
    eventVenue: MOCK.venue,
    eventCity: MOCK.city,
    coverImage: '',
    ticketTypeName: MOCK.ticketTypeName,
    ticketCode: MOCK.ticketCode,
    qrDataUrl: qrInvite,
    personalMessage: MOCK.personalMessage,
    inviteUrl: MOCK.inviteUrl,
    organizerName: 'Let Us Event',
    categoryLabel: MOCK.categoryLabel,
    sectorGate: MOCK.sectorGate
  }), 'utf8');

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BiletFeed — Bilet Tasarım Önizleme</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, 'Segoe UI', sans-serif; background: #f4f4f5; color: #18181b; }
    .wrap { max-width: 720px; margin: 0 auto; padding: 24px 16px 48px; }
    h1 { font-size: 1.5rem; margin: 0 0 8px; }
    .badge { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #FF8A00; margin-bottom: 8px; }
    .sub { color: #52525b; font-size: 14px; margin: 0 0 28px; line-height: 1.5; }
    section { margin-bottom: 36px; }
    h2 { font-size: 1.1rem; margin: 0 0 12px; }
    .card { background: #fff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; overflow-x: auto; }
    .ref img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
    .email-frame { width: 100%; height: 820px; border: 0; background: #0a0a0a; border-radius: 6px; }
    .tip { background: #fff7ed; border: 1px solid #ffd199; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #7c2d12; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="wrap">
    <p class="badge">Önizleme — deploy edilmedi</p>
    <h1>Bilet &amp; Davetiye Tasarımı</h1>
    <p class="sub">BiletFeed marka renkleri (#FF8A00) ve logo ile profesyonel bilet düzeni. Onayınızdan sonra canlıya alınacak.</p>
    <div class="tip">Next dev beklemeden açılır — <code>npm run preview:ticket</code> ile yeniden üretilir.</div>

    <section>
      <h2>İndirilebilir Bilet (PDF ile aynı düzen)</h2>
      <div class="card">${ticketCard}</div>
    </section>

    <section>
      <h2>İndirilebilir Davetiye</h2>
      <div class="card">${invitationCard}</div>
    </section>

    <section>
      <h2>E-posta — Bilet Satın Alma</h2>
      <iframe class="email-frame" title="Bilet e-posta" src="purchase-email.html"></iframe>
    </section>

    <section>
      <h2>E-posta — Davetiye</h2>
      <iframe class="email-frame" title="Davetiye e-posta" src="invitation-email.html"></iframe>
    </section>
  </div>
</body>
</html>`;

  const outPath = path.join(outDir, 'index.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`\n✅ Önizleme hazır:\n   file://${outPath}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
