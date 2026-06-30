# BiletFeed QR Biletleme Sistemi

Production-grade QR bilet altyapısı. Veri katmanı **PostgreSQL + Prisma**; Firebase yalnızca kimlik doğrulama ve görsel depolama için kullanılır.

---

## Tamamlanan Özellikler (iyzico hariç)

| Özellik | Durum |
|---------|--------|
| QR imzalama & doğrulama | ✅ |
| Ücretli + davetiye biletleri | ✅ |
| PDF / e-posta / takvim | ✅ |
| Kupon sistemi | ✅ |
| Bilet devri | ✅ |
| In-app bildirimler | ✅ |
| 24h / 2h / kapı açılış hatırlatmaları | ✅ |
| Admin: arama, force check-in, iptal, QR yenile | ✅ |
| Organizatör: yeniden gönder, manuel giriş, kuponlar | ✅ |
| Wallet pass kayıt (Apple/Google stub) | ✅ |
| Offline scan kuyruğu + Service Worker | ✅ |
| My Tickets: davetiye & devir sekmeleri | ✅ |

---

## Bekleyen (iyzico onayı sonrası)

- **iyzico production ödeme** — `lib/payments/providers/iyzico.ts`
- **FCM push** — `lib/notifications/push.ts` stub hazır
- **Apple/Google Wallet .pkpass** — `WalletPass` modeli + API kayıt hazır

---

## Prisma Modelleri

| Model | Açıklama |
|-------|----------|
| `PurchasedTicket` | QR bilet + `tokenNonce` (QR yenileme) |
| `Coupon` | İndirim kuponları |
| `TicketTransfer` | Bilet devri |
| `WalletPass` | Wallet pass istekleri |
| `Notification` | In-app bildirimler |
| `Event.gateOpenTime` | Kapı açılış hatırlatması |

Migration: `prisma/migrations/20260628180000_ticketing_features/`

---

## API Özeti

| Endpoint | Açıklama |
|----------|----------|
| `POST /api/coupons/validate` | Checkout kupon doğrulama |
| `GET/POST/DELETE /api/organizer/coupons` | Kupon CRUD |
| `POST /api/tickets/[id]/transfer` | Bilet devret |
| `POST /api/tickets/transfers/[id]/accept` | Devri kabul et |
| `GET/PATCH /api/notifications` | Bildirimler |
| `POST /api/admin/tickets/[id]` | Force check-in, iptal, QR yenile |
| `POST /api/organizer/tickets/[id]/resend` | Bilet e-postası yeniden gönder |
| `POST /api/organizer/tickets/[id]/check-in` | Manuel giriş |
| `POST /api/tickets/[id]/wallet` | Wallet pass kayıt |
| `GET /api/cron/event-reminders` | 24h e-posta + in-app |
| `GET /api/cron/event-reminders-2h` | 2h hatırlatma |
| `GET /api/cron/gate-open-reminders` | Kapı açılış |

---

## Cron (vercel.json)

- `event-reminders` — 07:00 & 15:00 UTC
- `event-reminders-2h` — saat başı :05
- `gate-open-reminders` — her 10 dk
- `expire-orders` — her 15 dk

---

## Güvenlik

- HMAC QR token + `tokenNonce` rotasyonu
- Organizatör/admin yetki kontrolü
- CSRF + rate limiting
- Check-in audit (`TicketCheckIn`)

---

## Deploy

```bash
npx prisma migrate deploy
npm run build
```

`CRON_SECRET` ve `TICKET_SECRET_KEY` production'da zorunludur.
