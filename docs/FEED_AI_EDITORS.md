# BiletFeed Feed — AI Editörler & Operasyon

Dergi tarzı feed (`/feed`) için kategori editörleri, kapak kapısı, kalite araçları ve FAZ 1–5 özeti.

## Kategori editörleri

Kaynak: `lib/feed/editors/`. Router (`resolveFeedEditor`) öncelik sırası:

1. Açık `editorId` (admin / API)
2. Feed kategori slug’ı
3. `contentType`
4. `general` (varsayılan)

| Editör ID | Rol | Tipik kategori / contentType |
|-----------|-----|------------------------------|
| `concert` | Konser Editörü | `konser-haberleri`, `concert_news` |
| `party` | Party / Eğlence | `eglence-haberleri`, `entertainment_news` |
| `festival` | Festival | `festival-haberleri`, `festival_news` |
| `music` | Müzik / Sanatçı | `muzik-haberleri`, `music_news`, `artist_news` |
| `trend` | Trend hikâye | `trend-hikayeler`, `trending_story` |
| `general` | Genel dergi | diğerleri |

Çıktı Zod ile doğrulanır (`lib/feed/editors/schema.ts`). Çalıştırma: `runFeedEditor` / `regenerateWithCategoryEditor` (`lib/feed/editors/run.ts`).

## DeepSeek / AI env

Feed AI yolları DeepSeek’i tercih eder (`preferDeepseek: true`); anahtar yoksa `lib/ai` fallback zinciri devreye girer.

```bash
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-chat          # opsiyonel
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1   # opsiyonel
AI_PROVIDER=deepseek                  # genel birincil (opsiyonel)
# Fallback: GEMINI_API_KEY veya OPENAI_API_KEY
```

Ayrıntılı provider matrisi: `docs/AI-PROVIDERS-TR.md`.

## Admin tetikleyiciler

| Aksiyon | Endpoint / yer | Not |
|---------|----------------|-----|
| Keşif başlat | `POST /api/admin/feed` `{ action: "discover" }` | Tavily + RSS pipeline |
| Kuyruk tek öğe | `{ action: "process-queue", queueId }` | AI draft → review |
| Kuyruk toplu | `{ action: "process-batch", batchSize }` | Admin UI: “Kuyruğu Toplu İşle” |
| AI taslak üret | `POST /api/admin/feed/ai-generate` | Editör router + Zod |
| AI yeniden yaz | `POST /api/admin/feed/[id]/ai-regenerate` | Kapak / status korunur |
| Yayınla | `POST /api/admin/feed` `{ postId }` | **Kapak zorunlu** |
| Toplu sil | `{ action: "bulk-delete", ids }` | Soft-delete |
| Toplu unfeature | `{ action: "bulk-unfeature", ids }` | Kalite / kapaksız kuyruk |
| Görsel düzelt | `{ action: "fix-images" }` | og:image + WebP |
| UI filtreler | Admin → Feed | “Görsel Eksik”, “Kalite düşük” kartları |

Panel: `/admin/feed`.

## Kapak kapısı & kalite

- Yayın / öne çıkarma: `isMissingFeedCoverImage` + `FEED_COVER_REQUIRED_MESSAGE` (`lib/feed/constants.ts`, `publishFeedPost`).
- Public listeler: `publishedWithImageWhere()` — kapaksız yayınlar sitede görünmez.
- Kalite skoru: `scoreFeedContentQuality` (`lib/feed/quality.ts`) — admin “Kalite düşük” rozeti.
- Featured ray: `meetsFeaturedQualityBar` / `pickFeaturedRail`.

### Operasyon scriptleri

```bash
# Sayımlar: yayında kapaksız, düşük kalite, kapaksız featured
npm run feed:quality-report

# Kapaksız yayınları listele (dry-run, varsayılan)
npm run feed:flag-coverless

# İnceleme + unfeature uygula
npm run feed:flag-coverless -- --apply
```

`--apply`: `status → review`, `isFeatured → false` (silmez).

## SEO

- `/feed/[slug]`: `NewsArticle` JSON-LD (`buildFeedNewsArticleSchema`)
- Meta: SEO title/description + kapak → Open Graph `article` + Twitter large image
- Sitemap: yayınlanmış feed slug’ları (`app/sitemap.ts`)

## FAZ 1–5 özeti

| FAZ | Commit | Özet |
|-----|--------|------|
| 1 | `c81b55a` | Kapak kapısı, markdown renderer, okuma chrome, AI prompt iskeleti |
| 2 | `be8ffd4` | Kategori editörleri, Zod şema, DeepSeek router |
| 3 | `d46e862` | Dergi UX, kaynak temizliği, şehir soft boost, kalite sinyalleri |
| 4 | `35c9b63` | Lead tipografi, event CTA, admin kalite filtreleri / unfeature |
| 5 | `fa52ace` | NewsArticle SEO, toplu unfeature, kalite scriptleri, docs, discovery polish |

Feed magazine + AI editör programı FAZ 5 ile kapanır; aşağıdaki opsiyonel faz ürünleştirmeyi tamamlar.

## Sonraki faz (ops.) — Kapak kaynağı + görüntülenme

### Kaynaktan kapak (`og:image`)

- Editorial kuyruk zaten draft oluştururken `fetchOgImage(sourceUrl)` + `normalizeCoverImageUrl` dener; yoksa **boş kapak + `review`** (placeholder yok).
- Admin listesi / düzenleme: kapaksız ve `sourceUrl` olan öğelerde **“Kaynaktan kapak çek”** → `POST /api/admin/feed` `{ action: "fetch-cover", postId }`.
- Toplu: `fix-images` artık boş/logo kapakları da kaynak OG ile dener; OG yoksa sayacı artırır, yayın kapısı değişmez.
- OG yoksa net mesaj: incelemede kalır; **kapaksız yayın hâlâ engelli** (`publishFeedPost` / FAZ 1).

### Editorial analytics (hafif)

- Makale görüntüleme: `FeedView` + `FeedPost.viewCount` (`recordFeedView` → `/feed/[slug]`).
- CTA tıklama (opsiyonel): `FeedPost.ctaClickCount` — `POST /api/feed/[id]/cta` (rate-limit + same-origin); `FeedEventCta` beacon.
- Admin `/admin/feed`: satırda görüntülenme + CTA; istatistik kartında toplam görüntülenme.
- SiteTracker pageview yolu ayrıca path bazlı site analitiğine düşer; feed sayaçları editör operasyonu içindir — ağır BI yok.

## Sıradaki faz — Ingest kapak + ilgili + admin strip

Üç ürünleştirme adımı (FAZ 1–5 / cover-assist sonrası):

1. **Auto cover on ingest** — `createFeedPostFromDraft` / admin update: `sourceUrl` var ve kapak eksikse `maybeAutoCoverOnIngest` → `pullCoverFromSource` (`normalizeCoverImageUrl`). Editorial kuyruk artık ayrı OG fetch yapmaz (tek yol). Cooldown: `aiMetadata.lastCoverFetchAt` + `FEED_COVER_AUTO_FETCH_COOLDOWN_MS` (6 saat). Fail soft → `review`, placeholder yok; yayın kapısı aynı. Admin “Kaynaktan kapak” `force: true` ile cooldown’u aşar.
2. **İlgili hikâyeler** — `/feed/[slug]` footer: 3 kart; önce aynı `feedCategoryId`, sonra aynı `contentType`, kalanı kapaklı güncel yayınlar. UI: `FeedMagazineCard` `size="small"`.
3. **Admin analytics strip** — `/admin/feed` üstü: mevcut sayaçlara ek top 5 `viewCount` + top 5 `ctaClickCount` (`getFeedAdminStats`). BI stack yok.

## Sonraki faz — Marka kapak + arama + paylaşım

1. **Marka kapak (OG son çare)** — `lib/feed/branded-cover.ts` Sharp SVG → WebP (1200×630, koyu `#0c1017` + başlık + kategori vurgu). Yükleme: `uploadAdminImage('feed', …)`. Servis: `generateBrandedCoverForPost`. Ingest: `maybeAutoCoverOnIngest` önce OG, başarısızsa (cooldown değilse) marka kapak. Admin: **“Marka kapak üret”** → `POST /api/admin/feed` `{ action: "generate-branded-cover", postId }` (`force: true`). `isMissingFeedCoverImage` / yayın kapısı aynı; `og-default` / logo / Unsplash fallback “gerçek kapak” sayılmaz.
2. **Feed arama** — `/feed` üstü debounced arama (`FeedSearchInput` → `GET /api/feed?q=&category=`). `searchFeedPosts` title/summary/tags/artistName; kategori chip ile birlikte çalışır.
3. **Paylaşım** — `FeedShareButton`: WhatsApp, X, link kopyala; mobilde Web Share API varsa “Cihazda paylaş”.
