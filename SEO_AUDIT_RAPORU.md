# BiletFeed SEO Denetim Raporu
**Tarih:** 14 Temmuz 2026  
**Uzman:** Claude (SEO Denetim)  
**Site:** biletfeed.com  
**Versiyon:** Production (Vercel)

---

## Yönetici Özeti

BiletFeed'in teknik SEO altyapısı genel olarak sağlam kurulmuş; sitemap, robots.txt, Open Graph etiketleri ve JSON-LD yapısal veri sistemi mevcut. Core Web Vitals metrikleri (LCP 748ms, FCP 300ms, TTFB 114ms) Google'ın "İyi" eşiğinin altında. Ancak 4 kritik ve 8 orta öncelikli sorun tespit edilmiştir. Bu sorunların giderilmesi, organik arama görünürlüğünü ve tıklama oranlarını doğrudan etkiler.

**Genel Puan: 62/100**

| Kategori | Puan | Durum |
|---|---|---|
| Teknik Altyapı | 80/100 | ✅ Güçlü |
| On-Page SEO | 55/100 | ⚠️ Geliştirme Gerekli |
| Yapısal Veri (Schema) | 70/100 | ⚠️ Eksikler Var |
| Sayfa Performansı | 90/100 | ✅ Mükemmel |
| İçerik SEO | 45/100 | 🔴 Kritik Eksikler |

---

## 1. Teknik Altyapı

### Güçlü Noktalar ✅

**Sitemap.xml — 229 URL, hatasız**
- Statik sayfalar, etkinlikler, feed yazıları, organizatörler, şehir sayfaları dahil
- Tüm URL'lerde `lastModified` mevcut
- Panel/admin/login gibi private URL'ler sızmamış
- Duplicate URL yok
- `https://biletfeed.com/sitemap.xml` → HTTP 200 ✅

**robots.txt — Doğru yapılandırılmış**
```
User-Agent: *
Allow: /
Disallow: /dashboard/, /organizator-panel/, /admin/, /api/
Disallow: /giris, /kayit, /odeme/, /profil ...
Sitemap: https://biletfeed.com/sitemap.xml
```

**Core Web Vitals — Google "İyi" eşiğinin altında**
| Metrik | Değer | Hedef | Durum |
|---|---|---|---|
| TTFB | 114ms | <200ms | ✅ |
| FCP | 300ms | <1800ms | ✅ |
| LCP | 748ms | <2500ms | ✅ |
| DOM Load | 288ms | — | ✅ |

**Canonical URL'ler — Tüm sayfalarda mevcut**

**Open Graph etiketleri — Eksiksiz**
- `og:title`, `og:description`, `og:image`, `og:type` → Tüm sayfalarda ✅
- Twitter Card: `summary_large_image` ✅

**`lang="tr"` — HTML elementinde tanımlanmış** ✅

**Alt text — 45 görselde 0 eksik** ✅

---

## 2. Kritik Sorunlar 🔴

### 2.1 Ana Sayfa H1 Etiketi YOK

**Bulgu:** `biletfeed.com` anasayfasında hiçbir `<h1>` etiketi bulunmuyor.  
**Etki:** Google, sayfanın ne hakkında olduğunu belirlemekte zorlanır. En yüksek etkili on-page sinyal eksik.  
**Konum:** `app/(site)/page.tsx`

**Çözüm:** `HomeHeroSection` bileşenine veya sayfa içine görünür bir H1 ekleyin.

```tsx
// app/(site)/page.tsx → HomeHeroSection içinde:
<h1 className="text-3xl font-bold">
  Türkiye'nin Etkinlik Bilet Platformu
</h1>
```

---

### 2.2 Arama Sayfası (/ara) Metadata Eksik

**Bulgu:** `/ara` sayfasında `export const metadata` veya `generateMetadata` yok. Google bu sayfayı varsayılan "Bilet Feed" başlığıyla indexliyor.  
**Etki:** Arama motoru, bu sayfanın amacını tanıyamaz. Arama bilincinde olan bir arama URL'i olarak değerlendirilemez.  
**Konum:** `app/(site)/ara/page.tsx`

**Çözüm:**
```tsx
// app/(site)/ara/page.tsx başına ekle:
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Etkinlik Ara',
  description: 'İstanbul, Ankara, İzmir ve tüm Türkiye genelindeki konser, festival ve tiyatro etkinliklerini arayın. Sanatçı, mekan veya tarihe göre filtreleyin.',
  path: '/ara',
  noIndex: false,
});
```

---

### 2.3 Meta Description Kırpılma Hatası — Şehir Sayfaları

**Bulgu:** `istanbul-etkinlikleri` sayfasında meta description tam 160 karakterde, cümle ortasında kesiyor:  
`"...BiletFeed ile Avr"` ← cümle bitmemiş

**Tam içerik olması gereken:**  
`"İstanbul; konser, tiyatro ... BiletFeed ile Avrupa ve Anadolu yakasındaki etkinlikleri tek ekranda keşfedebilir, biletlerinizi güvenle satın alabilirsiniz."` (268 karakter)

**Etki:** Google, anlamlı olmayan bir description görüyor ve kendi snippet'ini oluşturuyor (CTR düşer).  
**Neden:** `lib/seo/city-seo-content.ts` içindeki şehir intro metinleri 268 karakter iken şehir sayfası metadata'ya doğrudan `intro` paslandığında bir yerde 160'ta kesme oluyor.

**Araştırma:** Şehir sayfasının `generateMetadata` fonksiyonunu bulun ve description'ı `slice(0, 160)` gibi bir işlemden geçirip geçirmediğini kontrol edin.

**Geçici Çözüm:** `city-seo-content.ts` içindeki intro metinlerini 155 karakterin altına düşürün veya şehir sayfasında description için intro yerine ayrı bir kısa metin kullanın.

---

### 2.4 OG Image Yanlış — Logo Kullanılıyor

**Bulgu:** Ana OG görseli `logo-light.png` (bir marka logosu, küçük boyutlu) olarak ayarlanmış.  
**URL:** `https://biletfeed.com/brand/logo-light.png?v=17`  
**Etki:** Facebook, Twitter ve WhatsApp paylaşımlarında sayfa önizlemesi küçük bir logo gösteriyor. Düzgün bir 1200×630 OG banner'ı CTR'yi %20-40 artırabilir.

**Çözüm:**
1. `public/og-default.jpg` adında 1200×630 piksel boyutunda bir banner görseli oluşturun
2. `lib/seo/constants.ts` içinde güncelle:
```ts
export function getDefaultOgImage(): string {
  return `${siteConfig.url}/og-default.jpg`; // logo değil, banner
}
```
3. Etkinlik sayfaları için: etkinlik kapak görseli zaten kullanılıyor ✅ (sadece default değişmeli)

---

## 3. Orta Öncelikli Sorunlar ⚠️

### 3.1 Google Search Console Doğrulaması Yapılmamış

**Bulgu:** `GOOGLE_SITE_VERIFICATION` environment variable boş. Google Search Console'da site doğrulanmamış.  
**Etki:** Sitemap gönderilemez, crawl sorunları izlenemez, Core Web Vitals raporu alınamaz, manuel arama eylemleri görülemez.

**Çözüm:**
1. [Google Search Console](https://search.google.com/search-console)'a gidin
2. `biletfeed.com` ekleyin → HTML tag doğrulama metodunu seçin
3. `content="..."` değerini alın
4. Vercel env'e ekleyin:
   ```
   GOOGLE_SITE_VERIFICATION=xxxxxxxxxxxxxxxxxxxx
   ```
5. Sitemap URL'sini gönderin: `https://biletfeed.com/sitemap.xml`

---

### 3.2 Şehir Sayfaları H1 Uyuşmazlığı

**Bulgu:** `/istanbul-etkinlikleri` sayfasında:
- `<title>`: "İstanbul Etkinlikleri | Bilet Feed" ✅
- `<h1>`: "**Etkinlikler**" ← şehir adı yok ❌

Google, title ve H1 arasındaki uyuşmazlığı negatif sinyal olarak değerlendirilebilir.

**Çözüm:** City event page component'inde H1'i şehir adını içerecek şekilde güncelleyin:
```tsx
<h1>{cityName} Etkinlikleri</h1>
```

---

### 3.3 Anahtar Sayfalarda Meta Description Eksik/Zayıf

Aşağıdaki sayfalarda description ya yok ya da site varsayılanı kullanılıyor:

| Sayfa | Sorun |
|---|---|
| `/kategoriler` | description yok — siteConfig.description fallback kullanıyor |
| `/organizatorler` | description yok |
| `/mekanlar` | description yok |
| `/kariyer` | metadata yok |
| `/yardim` | metadata yok |
| `/organizator/[slug]` | description yok (sadece title var) |
| `/kategoriler/[slug]` | description yok |

**Örnek düzeltme:**
```tsx
// organizatorler/page.tsx
export const metadata = createPageMetadata({
  title: 'Organizatörler',
  description: 'Bilet Feed\'deki etkinlik organizatörlerini keşfedin. Konser, festival ve tiyatro düzenleyen organizatörleri takip edin.',
  path: '/organizatorler'
});
```

---

### 3.4 Sitemap'te Etkinlik Görseli (image:image) Yok

**Bulgu:** Sitemap, etkinlik URL'lerini listelediği halde `<image:image>` etiketleri kullanmıyor.  
**Etki:** Google Image Search'te etkinlik görselleri görünmez; görsel arama trafiği sıfır.

**Çözüm:** `app/sitemap.ts` içinde event entry'lerine kapak görseli ekle:
```ts
// prisma sorgusuna coverImage ekle
select: { slug: true, updatedAt: true, coverImage: true }

// map içinde:
{
  url: `${baseUrl}/etkinlik/${e.slug}`,
  images: e.coverImage ? [{ url: e.coverImage, title: e.slug }] : undefined,
  ...
}
```

---

### 3.5 Feed Makalelerinde `dateModified` Eksik

**Bulgu:** `NewsArticle` şemasında `dateModified` alanı yok.  
**Etki:** Google Haber'de "taze içerik" sinyali zayıf. Güncel haberler için update tarihi kritik.

**Çözüm:** `app/(site)/feed/[slug]/page.tsx` içindeki articleSchema'ya ekleyin:
```ts
const articleSchema = {
  ...
  datePublished: post.publishedAt,
  dateModified: post.updatedAt ?? post.publishedAt,  // ← ekle
  ...
}
```

---

### 3.6 `hreflang` x-default Eksik

**Bulgu:** `alternates.languages` sadece `'tr-TR': url` içeriyor; `x-default` tanımlı değil.  
**Etki:** Dil/bölge sinyali eksik; ileride çoklu dil eklenmesi halinde hreflang hatalarına yol açar.

**Çözüm:** `lib/seo/metadata.ts` → `buildAlternates` fonksiyonunu güncelle:
```ts
function buildAlternates(path: string): Metadata['alternates'] {
  const url = `${siteConfig.url}${path}`;
  return {
    canonical: url,
    languages: {
      'tr-TR': url,
      'x-default': url,  // ← ekle
    }
  };
}
```

---

### 3.7 Event Schema'da `validFrom` Dinamik ve Yanlış

**Bulgu:** `buildEventSchema` içinde:
```ts
validFrom: new Date().toISOString()  // her render'da şimdiki zaman!
```
**Etki:** Offer'ın başlangıç tarihi sürekli değiştiği için Google zengin sonuç kalitesi düşebilir.

**Çözüm:** Etkinliğin yayınlanma tarihi veya bilet satış başlangıcını kullanın:
```ts
validFrom: event.createdAt ?? event.startDate,
```

---

## 4. Düşük Öncelikli Öneriler 🟢

### 4.1 Web App Manifest Ekle (PWA Sinyali)
`public/manifest.json` oluşturun — mobil SEO ve "Ana Ekrana Ekle" için:
```json
{
  "name": "Bilet Feed",
  "short_name": "BiletFeed",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#f97316",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/brand/favicon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/brand/favicon.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
`layout.tsx`'e ekle: `<link rel="manifest" href="/manifest.json" />`

### 4.2 Organization Schema'ya YouTube Ekle
`siteConfig.links.youtube` var ama `buildOrganizationSchema` içindeki `sameAs` dizisine eklenmiyor.

### 4.3 FAQ Schema — Etkinlik Detay Sayfasına Ekle
`/sss` sayfasında `FAQPage` şeması mevcut ✅, ancak etkinlik detay sayfalarına da etkinliğe özel SSS eklenebilir ("Bilet iade edilebilir mi?", "Kapı saati ne zaman?" vs).

### 4.4 robots.txt `Host` Direktifi Gereksiz
`Host: https://biletfeed.com` — Bu yalnızca Yandex tarafından desteklenir. Zararsız ama gereksiz.

### 4.5 Favicon Boyutları Eksik
16×16 ve 32×32 piksel favicon'lar yok. Tarayıcı sekmelerinde netlik için eklenebilir.

### 4.6 İç Linkleme — Şehir Sayfaları Arası
Ana sayfada şehir bazlı seçenekler var ama `/istanbul-etkinlikleri` → `/ankara-etkinlikleri` gibi çapraz şehir linkleri yok.

---

## 5. Öncelik Sırası ve Tahmini Etki

| # | İyileştirme | Öncelik | Süre | SEO Etkisi |
|---|---|---|---|---|
| 1 | Ana sayfa H1 ekle | 🔴 Kritik | 15 dk | Yüksek |
| 2 | /ara sayfası metadata | 🔴 Kritik | 15 dk | Orta |
| 3 | OG image banner (1200×630) | 🔴 Kritik | 1-2 saat | Yüksek (CTR) |
| 4 | Meta description truncation düzelt | 🔴 Kritik | 30 dk | Yüksek |
| 5 | Google Search Console doğrula + sitemap gönder | ⚠️ Orta | 30 dk | Kritik (izleme) |
| 6 | Şehir sayfaları H1 güncelle | ⚠️ Orta | 30 dk | Orta |
| 7 | Eksik metadata'lar (7 sayfa) | ⚠️ Orta | 1 saat | Orta |
| 8 | Sitemap'e image:image ekle | ⚠️ Orta | 1 saat | Orta (görsel arama) |
| 9 | dateModified NewsArticle | ⚠️ Orta | 15 dk | Düşük-Orta |
| 10 | hreflang x-default | ⚠️ Orta | 10 dk | Düşük |
| 11 | validFrom düzelt | ⚠️ Orta | 10 dk | Düşük |
| 12 | PWA manifest | 🟢 Düşük | 30 dk | Düşük |
| 13 | Favicon 16/32px | 🟢 Düşük | 15 dk | Çok Düşük |

---

## 6. İyi Yapılanlar — Değiştirilmemeli

- **Event JSON-LD şeması** — Kapsamlı: performer, offers, location, organizer ✅
- **Sitemap dinamik oluşturma** — DB'den events/organizers/feed çekiyor ✅
- **Şehir SEO içerikleri** — 10 büyük şehir için özel metin, 6 bölüm başlığı ✅
- **BreadcrumbList** — Şehir ve feed sayfa larında mevcut ✅
- **SearchAction WebSite schema** — Google'ın Sitelinks Searchbox için ✅
- **revalidate: 300** — ISR ile 5 dakikada bir güncelleme ✅
- **Alt text** — 45 görselin tamamında mevcut ✅

---

## 7. Commit Önerisi

Kritik düzeltmeler için önerilen tek commit:

```bash
git add app/(site)/page.tsx \
        app/(site)/ara/page.tsx \
        lib/seo/metadata.ts \
        lib/seo/constants.ts \
        app/(site)/feed/[slug]/page.tsx \
        lib/seo/schemas.ts

git commit -m "seo: H1 ana sayfa, /ara metadata, hreflang x-default, dateModified fix, OG image"
git push origin main
```

---

*Bu rapor 14 Temmuz 2026 tarihinde biletfeed.com production ortamında canlı tarama ve kaynak kodu analizi ile hazırlanmıştır.*
