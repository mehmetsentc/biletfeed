import { notFound } from 'next/navigation';
import { IyzicoCheckoutPageClient } from '@/components/payments/iyzico-checkout-page-client';
import type { IyzicoPaymentPageContext } from '@/lib/services/payment-page';

export const dynamic = 'force-dynamic';

/** Lokal önizleme — BiletFeed koyu temasına yakın mock form (canlıda İyzico UI gelir) */
const PREVIEW_FORM_HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    :root{
      --bg:#0b0b0b; --card:#111; --line:rgba(255,255,255,.1);
      --text:#f5f5f5; --muted:#a3a3a3; --neon:#DFFF00; --neon-on:#050505;
      --input:#181818; --input-border:rgba(255,255,255,.14);
    }
    *{box-sizing:border-box}
    body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text)}
    .tabs{display:flex;border-bottom:1px solid var(--line);background:var(--card)}
    .tab{flex:1;padding:12px 8px;text-align:center;font-size:12px;font-weight:650;color:var(--muted)}
    .tab.on{color:var(--neon-on);background:var(--neon);border-bottom:0}
    .note{margin:12px;padding:10px 12px;border-radius:12px;border:1px solid rgba(223,255,0,.25);background:rgba(223,255,0,.08);color:#e8f5a0;font-size:11px;line-height:1.45}
    .field{margin:12px 14px}
    label{display:block;font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--muted);margin-bottom:6px}
    input{
      width:100%;padding:12px 14px;border:1px solid var(--input-border);border-radius:12px;
      background:var(--input);color:var(--text);font-size:14px;outline:none
    }
    input::placeholder{color:#666}
    input:focus{border-color:rgba(223,255,0,.55);box-shadow:0 0 0 3px rgba(223,255,0,.15)}
    .row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 14px}
    button{
      display:block;width:calc(100% - 28px);margin:18px 14px 24px;padding:14px;border:0;border-radius:14px;
      background:var(--neon);color:var(--neon-on);font-size:15px;font-weight:800;letter-spacing:.01em
    }
  </style>
</head>
<body>
  <div class="tabs">
    <div class="tab on">Kartla Ödeme</div>
    <div class="tab">iyzico ile Öde</div>
  </div>
  <div class="note">Lokal önizleme — canlıda İyzico güvenli formu bu alanda açılır; kart BiletFeed’de tutulmaz.</div>
  <div class="field">
    <label>Kart Üzerindeki Ad Soyad</label>
    <input placeholder="Ad Soyad" autocomplete="cc-name"/>
  </div>
  <div class="field">
    <label>Kart Numarası</label>
    <input placeholder="•••• •••• •••• ••••" autocomplete="cc-number"/>
  </div>
  <div class="row">
    <div>
      <label>Ay / Yıl</label>
      <input placeholder="AA/YY" autocomplete="cc-exp"/>
    </div>
    <div>
      <label>CVC</label>
      <input placeholder="•••" autocomplete="cc-csc"/>
    </div>
  </div>
  <button type="button">3.000,00 TL ÖDE</button>
</body>
</html>`;

const previewContext: IyzicoPaymentPageContext = {
  orderId: 'preview-order',
  total: 3000,
  currency: 'TRY',
  eventTitle: 'SEFO',
  eventSlug: 'sefo',
  coverImage:
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=200&h=200&q=60',
  ticketSummary: 'GENEL GİRİŞ ALKOLLÜ ×1',
  sessionId: 'preview',
  iframeUrl: 'about:blank',
  checkoutFormHtml: PREVIEW_FORM_HTML,
  hostedPaymentUrl: '#',
  cancelUrl: '/',
  expiresAt: null
};

/** Sadece geliştirme — production’da 404 */
export default function IyzicoPaymentPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <IyzicoCheckoutPageClient context={previewContext} />;
}
