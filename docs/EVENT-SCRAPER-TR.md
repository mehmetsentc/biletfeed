# Etkinlik Scraper Botu

Bilet Feed, **Biletix**, **Bubilet**, **Biletimo** ve **Passo** kaynaklarından
her gün **21:00 (Türkiye saati)** yeni etkinlikleri toplar.

## Nasıl çalışır?

1. **Scraper adaptörleri** her platformun listeleme sayfasını çeker.
2. **Tekilleştirme (dedupe):** Aynı etkinlik birden fazla sitede varsa yalnızca
   bir kayıt yayınlanır (öncelik: Biletix → Passo → Bubilet → Biletimo).
3. **Kendi etkinlikleriniz** (`listingType: internal`) her zaman önceliklidir;
   harici kayıt aynı etkinliği ezmez.
4. **Bilet Al:** Harici etkinliklerde kullanıcı kaynak siteye yönlendirilir;
   kendi etkinliklerinizde `/odeme/[slug]` kullanılır.

## Kurulum

```bash
# Veritabanı şemasını güncelle
npm run db:scrape-push

# Cron güvenlik anahtarı (.env.local + Vercel)
CRON_SECRET=uzun-rastgele-bir-deger
```

Vercel Cron: `vercel.json` içinde `0 18 * * *` (18:00 UTC = 21:00 TR)

## Manuel çalıştırma

```bash
npm run scrape:run
```

## AI parser (önerilen)

Site HTML yapısı değiştiğinde AI agent devreye girer. Kurulum:
[SCRAPER-AI-TR.md](./SCRAPER-AI-TR.md)

```bash
SCRAPER_AI_ENABLED=true
SCRAPER_AI_API_KEY=your-key
SCRAPER_AI_BASE_URL=https://api.openai.com/v1   # veya sizin API URL
SCRAPER_AI_MODEL=gpt-4o-mini
```

Production cron endpoint:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://biletfeed.com/api/cron/scrape-events
```

## Platform parser bakımı

HTML yapıları değişebilir. Parser dosyası:

- `lib/scraper/platforms/index.ts`

JSON-LD (`application/ld+json`) desteklenir. Site yapısı değişirse ilgili
adaptörde selector/parser güncellenmelidir.

## Yasal not

Kaynak sitelerin kullanım koşullarına uyun. Mümkünse resmi API/affiliate
programları tercih edin. Scraper yalnızca kamuya açık listeleme verilerini
toplar; kişisel veri saklamaz.
