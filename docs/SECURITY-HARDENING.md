# Güvenlik Sertleştirmesi (Banka / Ödeme Hazırlığı)

## Uygulanan kontroller

| Alan | Uygulama |
|------|----------|
| Admin API | Granüler `requireAdminPermission` — UI ile aynı yetkiler |
| Otomasyon | `ADMIN_SECRET` ≠ `CRON_SECRET` — yıkıcı admin işlemleri cron secret ile yapılamaz |
| XSS | Organizatör duyuru HTML → `sanitizeOrganizerHtml` (DOMPurify) |
| Oturum | Production DB hatasında fail-closed; rol cookie'den devam etmez |
| Ödeme callback | Production'da tutar doğrulaması zorunlu |
| Bilet kodu | `BF-` + 12 hex (6 byte entropy) — yeni biletler |
| Rate limit | Redis async: auth, checkout, kupon, PDF, events-by-city, EventJoy |
| Upload | Magic-byte doğrulama (JPEG/PNG/WebP/GIF) |
| EventJoy | Auth zorunlu (feature açıkken) |
| `/api/auth/health` | Production'da anonim detay sızdırmaz |

## Vercel env (production)

```bash
openssl rand -base64 48  # NEXTAUTH_SECRET
openssl rand -base64 48  # TICKET_SECRET_KEY
openssl rand -base64 32  # CRON_SECRET
openssl rand -base64 32  # ADMIN_SECRET  ← CRON'dan farklı!
```

Ayrıca: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`

## Kalan (ödeme anlaşması sonrası)

- iyzico/PayTR callback `verifyCallback` implementasyonu
- CSP `unsafe-inline` / `unsafe-eval` sıkılaştırma (Firebase uyumu)
- Apple/Google Wallet (`WALLET_ENABLED=true` + sertifikalar)

## Doğrulama

```bash
npm run test
npm run setup:check
```
