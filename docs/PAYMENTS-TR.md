# Ödeme Altyapısı (Bilet Feed)

Ödeme kuruluşu API anahtarları olmadan çalışan altyapı. Şirket onayı sonrası yalnızca env değişkenleri ve provider dosyaları tamamlanır.

## Akış

```
Checkout → pending sipariş → ödeme sayfası (hosted) → callback/webhook → paid → QR bilet
```

1. `POST /api/orders/checkout` — `pending` sipariş oluşturur (ücretsiz etkinlikte doğrudan `paid`)
2. Kullanıcı `redirectUrl` ile ödeme sayfasına gider (kart bilgisi Bilet Feed'de toplanmaz)
3. `POST /api/payments/callback/{provider}` — ödeme onayı, bilet üretimi
4. `/odeme/basarili?order=...` — başarı sayfası

## Ortam değişkenleri

```env
# Geliştirme (varsayılan)
PAYMENT_PROVIDER=mock
ENABLE_MOCK_PAYMENTS=true

# Canlı — şirket onayı sonrası
# PAYMENT_PROVIDER=iyzico
# IYZICO_API_KEY=
# IYZICO_SECRET_KEY=
# IYZICO_BASE_URL=https://api.iyzipay.com

# PAYMENT_PROVIDER=paytr
# PAYTR_MERCHANT_ID=
# PAYTR_MERCHANT_KEY=
# PAYTR_MERCHANT_SALT=

# PAYMENT_PROVIDER=stripe
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
```

## Mock test (geliştirme)

1. `PAYMENT_PROVIDER=mock`
2. Etkinlikten checkout → test ödeme sayfası (`/odeme/islem/{orderId}`)
3. "Ödemeyi Simüle Et" → bilet oluşur

## Şirket onayı sonrası yapılacaklar

1. `lib/payments/providers/iyzico.ts` (veya paytr/stripe) içinde `createCheckoutSession` ve `verifyCallback` implement et
2. Ödeme kuruluşu panelinde callback URL: `https://biletfeed.com/api/payments/callback/iyzico`
3. Vercel production env anahtarlarını gir
4. `PAYMENT_PROVIDER=iyzico` yap, `ENABLE_MOCK_PAYMENTS` kaldır
5. Küçük tutarla canlı test

## Admin

- `/admin/islemler` — sipariş listesi
- `POST /api/admin/orders/{id}/refund` — mock/free iade; gerçek provider için 501 döner

## Veritabanı

Yeni alanlar (`orders`):

- `payment_session_id`
- `expires_at` — pending sipariş süresi (15 dk)
- `paid_at`

```bash
npx prisma db push
```

## Yasal sayfalar

- `/mesafeli-satis`
- `/iade-iptal`
- `/gizlilik`

Şirket bilgileri eklendikçe mesafeli satış sayfası güncellenmelidir.
