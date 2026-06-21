# AI Sağlayıcıları — DeepSeek & Google Gemini

BiletFeed, AI işlemleri için **DeepSeek** (birincil) ve **Google Gemini** (yedek) kullanır.

## Hızlı kurulum

`.env.local` dosyanıza ekleyin:

```bash
AI_ENABLED=true
SCRAPER_AI_ENABLED=true
SCRAPER_AI_PROVIDER=deepseek
SCRAPER_AI_FALLBACK_PROVIDER=gemini

DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-chat

GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash
```

## Sağlayıcı seçimi

| Değişken | Açıklama |
|----------|----------|
| `SCRAPER_AI_PROVIDER` | Birincil sağlayıcı: `deepseek` veya `gemini` |
| `SCRAPER_AI_FALLBACK_PROVIDER` | Birincil başarısız olursa denenecek yedek |
| `AI_PROVIDER` | Genel birincil sağlayıcı (scraper dışı modüller için) |

Otomatik seçim sırası (env yoksa):

1. `DEEPSEEK_API_KEY` varsa → DeepSeek
2. `GEMINI_API_KEY` varsa → Gemini
3. `OPENAI_API_KEY` varsa → OpenAI uyumlu

## DeepSeek

- API: OpenAI uyumlu `chat/completions`
- Varsayılan URL: `https://api.deepseek.com/v1`
- Önerilen model: `deepseek-chat`
- JSON modu desteklenir (etkinlik çıkarma için)

Anahtar: [platform.deepseek.com](https://platform.deepseek.com)

## Google Gemini

- API: `generateContent` (Generative Language API)
- Varsayılan URL: `https://generativelanguage.googleapis.com/v1beta`
- Önerilen model: `gemini-2.0-flash`
- JSON çıktı: `responseMimeType: application/json`

Anahtar: [Google AI Studio](https://aistudio.google.com/apikey)

## Kullanım alanları

| Modül | Dosya | Durum |
|-------|-------|-------|
| Etkinlik scraper (HTML parse) | `lib/scraper/ai/extract-events.ts` | Aktif |
| AI dedupe | `lib/scraper/ai/dedupe-events.ts` | `SCRAPER_AI_DEDUPE=true` |
| Genel AI client | `lib/ai/client.ts` | Hazır (haber/AI agent için) |

## Kod örneği

```typescript
import { aiChat } from '@/lib/ai/client';

const result = await aiChat(
  [
    { role: 'system', content: 'Sen bir etkinlik editörüsün.' },
    { role: 'user', content: 'Bu metni özetle: ...' }
  ],
  { jsonMode: true, provider: 'gemini' }
);

console.log(result.provider, result.model, result.content);
```

## Vercel ortam değişkenleri

Production'da şunları ekleyin:

- `AI_ENABLED=true`
- `SCRAPER_AI_ENABLED=true`
- `SCRAPER_AI_PROVIDER=deepseek`
- `SCRAPER_AI_FALLBACK_PROVIDER=gemini`
- `DEEPSEEK_API_KEY` (Secret)
- `GEMINI_API_KEY` (Secret)
- `CRON_SECRET` (scraper cron için)

Anahtarları chat'e veya repoya yapıştırmayın — yalnızca Vercel Environment Variables.

## Mimari

```
lib/ai/
  client.ts          → aiChat() — birincil + fallback
  config.ts          → sağlayıcı çözümleme
  types.ts
  providers/
    gemini.ts        → Google Gemini API
    openai-compatible.ts → DeepSeek / OpenAI
    index.ts
```

Scraper katmanı (`lib/scraper/ai/`) bu ortak client'ı kullanır.

## Geriye dönük uyumluluk

Eski `SCRAPER_AI_API_KEY` + `SCRAPER_AI_BASE_URL` ayarları hâlâ OpenAI uyumlu modda çalışır.
DeepSeek veya Gemini kullanmak için yukarıdaki yeni env değişkenlerini tercih edin.
