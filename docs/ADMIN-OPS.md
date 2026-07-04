# Admin bakım API'leri

Tüm endpoint'ler admin oturumu veya `CRON_SECRET` / `ADMIN_SECRET` Bearer token gerektirir.

| Endpoint | Açıklama |
|----------|----------|
| `POST /api/admin/scrape-now` | Harici platform etkinlik scrape (SCRAPER_ENABLED=true) |
| `POST /api/admin/seed-event-rules` | Etkinlik kural kataloğunu upsert |
| `POST /api/admin/recategorize` | Etkinlik kategorilerini yeniden eşle |
| `POST /api/admin/fix-city-names` | Şehir adı normalizasyonu |
| `POST /api/admin/ai-edit` | AI destekli etkinlik düzenleme (OPENAI_API_KEY) |
| `POST /api/admin/purge-all` | **Tehlikeli** — tüm scrape edilmiş etkinlikleri siler |

Cron (Bearer `CRON_SECRET`):

| Endpoint | Açıklama |
|----------|----------|
| `POST /api/cron/seed-event-rules` | Production kural kataloğu seed |
| `POST /api/cron/scrape-events` | Zamanlanmış scrape |
| `POST /api/cron/accounting` | Gelir tanıma |

Admin panel: `/admin/ayarlar` → **Bakım İşlemleri** → Etkinlik Kurallarını Seed Et

Yerel:

```bash
npm run seed:event-rules
npm run db:setup          # push + seed + event-rules
npm run cron:trigger      # varsayılan scrape cron
CRON_TARGET_URL=https://biletfeed.com/api/cron/seed-event-rules npm run cron:trigger
```
