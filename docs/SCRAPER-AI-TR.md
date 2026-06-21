# AI destekli etkinlik scraper

Klasik JSON-LD parser yetersiz kaldığında **AI agent** devreye girer ve HTML'den
etkinlik listesi çıkarır.

> **Önerilen sağlayıcılar:** DeepSeek (birincil) + Google Gemini (yedek).  
> Detaylı kurulum: [AI-PROVIDERS-TR.md](./AI-PROVIDERS-TR.md)

## Ortam değişkenleri (Vercel + .env.local)

```bash
AI_ENABLED=true
SCRAPER_AI_ENABLED=true
SCRAPER_AI_PROVIDER=deepseek
SCRAPER_AI_FALLBACK_PROVIDER=gemini

DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-chat

GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash

# Opsiyonel: benzer etkinlikleri AI ile birleştir
SCRAPER_AI_DEDUPE=true

# Opsiyonel: HTML metin limiti
SCRAPER_AI_MAX_HTML_CHARS=48000
```

### Eski OpenAI uyumlu ayarlar (geriye dönük)

```bash
SCRAPER_AI_API_KEY=sk-...
SCRAPER_AI_BASE_URL=https://api.openai.com/v1
SCRAPER_AI_MODEL=gpt-4o-mini
```

Alternatif isimler: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AI_API_KEY`.

## Desteklenen sağlayıcılar

| Sağlayıcı | Env | API |
|-----------|-----|-----|
| **DeepSeek** (önerilen) | `DEEPSEEK_API_KEY` | OpenAI uyumlu |
| **Google Gemini** (yedek) | `GEMINI_API_KEY` | Generative Language API |
| OpenAI / OpenRouter | `SCRAPER_AI_API_KEY` | OpenAI uyumlu |

## Akış

1. Platform sayfası indirilir
2. JSON-LD varsa → klasik parser
3. JSON-LD boş + AI açık → `extractEventsWithAi()` HTML özetini modele gönderir
4. Model yapılandırılmış JSON döndürür → veritabanına yazılır
5. (Opsiyonel) `SCRAPER_AI_DEDUPE=true` → benzer kayıtlar AI ile birleştirilir

## Test

```bash
# .env.local içinde SCRAPER_AI_* değerlerini doldurun
npm run scrape:run
```

## API anahtarı paylaşımı

Anahtarı sohbette paylaşmayın. Vercel Dashboard → Settings → Environment Variables:

- `SCRAPER_AI_ENABLED` = `true`
- `SCRAPER_AI_API_KEY` = (gizli)
- `SCRAPER_AI_BASE_URL` = (sağlayıcı URL'niz)
- `SCRAPER_AI_MODEL` = (model adınız)

Sonra `npm run deploy:env` veya manuel ekleyip redeploy edin.

## Dosyalar

- `lib/scraper/ai/client.ts` — OpenAI uyumlu HTTP istemcisi
- `lib/scraper/ai/extract-events.ts` — HTML → etkinlik listesi
- `lib/scraper/ai/dedupe-events.ts` — fuzzy dedupe
- `lib/scraper/ai/config.ts` — ortam değişkenleri
