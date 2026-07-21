# GA4 Admin Analitik — Servis Hesabı Kurulumu

Admin panelindeki **Trafik Analitiği** sekmesi iki kaynaktan beslenir:

1. **First-party** (Postgres + Redis) — consent sonrası pageview / web vitals (kod tarafında hazır)
2. **GA4 Data API** — kanal, coğrafya, cihaz, realtime (bu dokümandaki env gerekir)

Env yoksa build kırılmaz; GA4 panelleri boş state / “bağlantı yok” gösterir.

## Adımlar

1. [Google Cloud Console](https://console.cloud.google.com) → GA4 ile aynı (veya yeni) proje
2. **IAM & Admin → Service Accounts** → Create service account  
   - Rol: gerekmez (GA4 tarafında Viewer yeterli)
3. Keys → Add key → JSON indir
4. [Google Analytics](https://analytics.google.com) → Yönetici → Mülk erişim yönetimi  
   - Servis hesabı e-postasını **Görüntüleyici (Viewer)** olarak ekle
5. Property ID: Yönetici → Mülk ayarları → **Mülk kimliği** (sayı, örn. `123456789`)

## Vercel / `.env`

```bash
GA4_PROPERTY_ID=123456789
# JSON tek satır veya base64
GOOGLE_ANALYTICS_CREDENTIALS={"type":"service_account",...}
```

Mevcut tracking için:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX
```

## Bilinçli v1 dışı (sonraki faz)

- Mobil app DAU/MAU / Crashlytics / push open rate
- Client JS hata ve API 4xx/5xx paneli
- Cohort / retention e-posta raporu
- Özel tarih date-picker (şu an: Bugün / 7 / 30 / 90 + önceki dönem %)
