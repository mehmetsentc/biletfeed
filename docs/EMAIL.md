# BiletFeed — E-posta Sistemi (Resend)

Tüm transactional e-postalar [Resend](https://resend.com) üzerinden gönderilir. Merkezi yapılandırma: `lib/config/email.ts`.

## Mimari

```
lib/config/email.ts          ← Gönderen adresleri, reply-to, şablon eşlemesi
lib/email/resend.ts          ← Resend REST API (npm paketi yok)
lib/accounting/email.ts      ← queueEmail + delivery tracking (email_deliveries)
lib/email/*-template.ts      ← HTML şablonları (dark tema, marka uyumlu)
```

### E-posta türleri

| Şablon | Gönderen | Tetikleyici |
|--------|----------|-------------|
| `ticket_purchase` | tickets@ | Sipariş ödendi → `sendTicketPurchaseEmail` |
| `event_invitation` | davetiye@ | Davetiye oluşturuldu → `event-invitations.ts` |
| `invoice_issued` | fatura@ | Muhasebe → `sendInvoiceEmail` |
| `order_refund` | tickets@ | Admin iade → `sendRefundNotificationEmail` |
| `event_reminder` | tickets@ | Cron (24h önce) → `sendEventReminderEmails` |

---

## Resend Kurulumu

### 1. Hesap ve API anahtarı

1. [resend.com](https://resend.com) → Sign up
2. **API Keys** → Create API Key (Sending access)
3. Anahtarı Vercel'e `RESEND_API_KEY` olarak ekleyin

### 2. Domain doğrulama (biletfeed.com)

1. Resend Dashboard → **Domains** → Add Domain → `biletfeed.com`
2. DNS kayıtlarını domain sağlayıcınıza (Cloudflare, GoDaddy vb.) ekleyin:

| Kayıt | Amaç |
|-------|------|
| **SPF** (TXT) | Resend'in sizin adınıza göndermesine izin verir |
| **DKIM** (CNAME/TXT) | E-posta bütünlüğü imzası |
| **DMARC** (TXT, opsiyonel) | `_dmarc.biletfeed.com` — spoofing koruması |

Resend paneli size tam DNS değerlerini verir; kopyalayıp yapıştırın. Doğrulama genelde birkaç dakika–24 saat sürer.

**Önerilen DMARC (başlangıç):**
```
v=DMARC1; p=none; rua=mailto:destek@biletfeed.com
```
Teslimat istatistiklerini topladıktan sonra `p=quarantine` veya `p=reject`'e geçin.

### 3. Gönderen adresleri

Resend'de domain doğrulandıktan sonra aşağıdaki adresler kullanılabilir (ayrıca Resend'de oluşturmanız gerekmez — domain doğrulaması yeterli):

- `tickets@biletfeed.com` — bilet onayı, iade, hatırlatma
- `davetiye@biletfeed.com` — EventJoy davetiyeleri
- `fatura@biletfeed.com` — e-Arşiv / fatura bildirimi
- `noreply@biletfeed.com` — otomatik bildirimler (gelecek)
- `destek@biletfeed.com` — reply-to / destek

---

## Ortam Değişkenleri

Vercel Dashboard → Settings → Environment Variables:

```bash
# Zorunlu (canlı gönderim)
RESEND_API_KEY=re_xxxxxxxx

# Gönderen kimliği
RESEND_FROM_NAME=BiletFeed
RESEND_FROM_EMAIL=tickets@biletfeed.com

# Yanıt ve destek
RESEND_REPLY_TO=destek@biletfeed.com
RESEND_SUPPORT_EMAIL=destek@biletfeed.com

# Tür bazlı gönderenler (opsiyonel — varsayılanlar biletfeed.com)
RESEND_TICKETS_FROM=tickets@biletfeed.com
RESEND_INVITATION_FROM=davetiye@biletfeed.com
RESEND_INVOICE_FROM=fatura@biletfeed.com
RESEND_NOREPLY_FROM=noreply@biletfeed.com
```

`RESEND_API_KEY` yoksa sistem **log-only** modda çalışır: e-postalar `email_deliveries` tablosuna kaydedilir, gerçek gönderim yapılmaz.

---

## Test

### Admin endpoint

Admin oturumu ile (CSRF korumalı):

```bash
curl -X POST https://biletfeed.com/api/admin/test-email \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{"to":"sizin@email.com"}'
```

Yanıt: `{ "ok": true, "messageId": "...", "from": "BiletFeed <tickets@biletfeed.com>" }`

### Lokal geliştirme

1. `.env.local` dosyasına `RESEND_API_KEY` ekleyin (commit etmeyin)
2. Resend sandbox modunda yalnızca doğrulanmış alıcılara gönderim yapılır
3. `npm run dev` → admin panelinden veya curl ile test edin

---

## Etkinlik Hatırlatması (Cron)

`lib/email/send-event-reminder-email.ts` — etkinlikten ~24 saat önce ödenmiş siparişlere hatırlatma gönderir.

Önerilen cron route (henüz deploy edilmedi):

```
GET /api/cron/event-reminders
Authorization: Bearer $CRON_SECRET
```

Vercel Cron örneği (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/event-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## Delivery Tracking

Tüm e-postalar `email_deliveries` tablosuna yazılır:

- `queued` → `sent` / `failed`
- `messageId` — Resend API yanıtından (`re_...` formatı)
- Admin: `/admin/muhasebe` → E-posta logları

İleride Resend webhook ile `delivered` / `opened` / `bounced` durumları eklenebilir.

---

## Sorun Giderme

| Belirti | Çözüm |
|---------|-------|
| E-posta gitmiyor | `RESEND_API_KEY` Vercel'de tanımlı mı? |
| 403 / domain error | biletfeed.com DNS kayıtları doğrulandı mı? |
| Sandbox'ta alıcı reddediliyor | Resend'de alıcı e-postasını verify edin |
| `email_not_configured` | Key boş veya yanlış environment'ta |
| Spam klasörü | DKIM/DMARC tamamlandı mı? From adresi domain ile uyumlu mu? |

Loglar (production): `[email] Resend send failed` — status ve hata özeti; API key ve tam alıcı adresi loglanmaz.

---

## İlgili Dosyalar

- `lib/config/email.ts` — tek yapılandırma kaynağı
- `lib/email/resend.ts` — düşük seviye gönderici
- `lib/accounting/email.ts` — kuyruk + audit
- `.env.example` — tüm env var'lar
- `docs/ACCOUNTING.md` — fatura e-postası akışı
