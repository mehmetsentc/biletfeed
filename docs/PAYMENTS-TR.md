# Ödeme Altyapısı (Bilet Feed)

Ödeme kuruluşu API anahtarları olmadan çalışan altyapı. Canlıda varsayılan sağlayıcı **iyzico** (Checkout Form).

## Akış

```
Checkout → pending sipariş → iyzico ödeme sayfası → callback → paid → QR bilet
```

1. `POST /api/orders/checkout` — `pending` sipariş oluşturur (ücretsiz etkinlikte doğrudan `paid`)
2. Kullanıcı `redirectUrl` ile iyzico Checkout Form sayfasına gider (kart bilgisi Bilet Feed'de toplanmaz)
3. `POST /api/payments/callback/iyzico` — token ile `checkoutForm.retrieve`, bilet üretimi
4. `/odeme/basarili?order=...` — başarı sayfası

## Ortam değişkenleri

```env
# Geliştirme (varsayılan)
PAYMENT_PROVIDER=mock
ENABLE_MOCK_PAYMENTS=true

# Canlı — iyzico
PAYMENT_PROVIDER=iyzico
IYZICO_API_KEY=
IYZICO_SECRET_KEY=
IYZICO_BASE_URL=https://api.iyzipay.com
# Sandbox: https://sandbox-api.iyzipay.com

# Rollback (pasif — yalnızca acil durum)
# PAYMENT_PROVIDER=tosla
# TOSLA_CLIENT_ID=
# TOSLA_API_USER=
# TOSLA_STORE_KEY=
```

## Mock test (geliştirme)

1. `PAYMENT_PROVIDER=mock`
2. Etkinlikten checkout → test ödeme sayfası (`/odeme/islem/{orderId}`)
3. "Ödemeyi Simüle Et" → bilet oluşur

## iyzico (canlı)

1. `PAYMENT_PROVIDER=iyzico` (production fallback da `iyzico`)
2. `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, isteğe bağlı `IYZICO_BASE_URL`
3. İyzico panelinde callback URL: `https://biletfeed.com/api/payments/callback/iyzico`
4. Kod: `lib/payments/providers/iyzico.ts` — Checkout Form initialize + retrieve
5. TCKN checkout’ta toplanmadığı için İyzico `identityNumber` placeholder (`11111111111`) kullanılır
6. **iOS/Android Capacitor:** `mobile/capacitor.config.ts` → `server.allowNavigation: ['*']` — banka 3DS ACS WebView’da kalır

## Paraşüt bağlantısı

Ödeme İyzico’dan tahsil edilir; e-belge Paraşüt’ten kesilir. Peşin satış için Paraşüt’te **İyzico’nun hakedişinin düştüğü kasa/banka** id’sini verin:

```
PARASUT_PAYMENT_ACCOUNT_ID=<iyzico_tahsilat_banka_hesabi_id>
```

Satış faturası `cash_sale` + bu hesap ile oluşturulur (`payment_description`: `BiletFeed İyzico — BF…`).

## Tosla (pasif / rollback)

`PAYMENT_PROVIDER=tosla` ile geri açılabilir. Kart formu `/odeme/kart/[orderId]` Tosla ProcessCardForm kullanır. Varsayılan değildir.

## Veritabanı

Yeni alanlar (`orders`):

- `payment_session_id` (iyzico: Checkout Form `token`)
- `expires_at` — pending sipariş süresi (15 dk)
- `paid_at`

## Yasal sayfalar

- `/mesafeli-satis`
- `/gizlilik`
- `/iade`
