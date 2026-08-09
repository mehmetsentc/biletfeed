import { slugify } from '@/lib/utils/slug';
import {
  extractJsonObject,
  parseFeedAiOutput,
  sanitizeContentType,
  type FeedAiOutput
} from '@/lib/feed/editors/schema';
import type { AiEditorDraft, FeedEditorDefinition, FeedEditorId } from '@/lib/feed/editors/types';
import type { FeedPostType } from '@prisma/client';
import type { AiChatResult } from '@/lib/ai/types';

export const BASE_SYSTEM_PROMPT = `Sen BiletFeed AI Editörüsün — Türkiye'nin etkinlik keşif platformunun otonom editörüsün.
Uzmanlık: konser, parti/gece hayatı, festival, tiyatro ve sinema haberciliği.
Yalnızca Türkçe yaz. İngilizce başlık, bölüm adı veya kalıp kullanma (ör. "Highlights", "What to Expect" yasak).

Görevin: Kamuya açık etkinlik haberlerinden veya editör notlarından TAMAMEN ORİJİNAL, dergi kalitesinde Türkçe içerik üretmek.

DİL VE TON:
- Sadece Türkçe
- Profesyonel, samimi, modern, hikâye anlatıcı
- SEO spam değil, doğal dil
- Konser / parti / festival jargonunu Türkçe kullan

GÖVDE YAPISI (content alanı — markdown):
- İlk blok: giriş (lead) paragrafı — başlık tekrarı YOK
- En az 3 adet ## (H2) alt başlık; # (H1) KULLANMA
- Gerekiyorsa ### kullanabilirsin
- En az bir madde veya numaralı liste (- veya 1.)
- title alanındaki ana başlığı gövdede # ile tekrarlama
- En az 4 paragraf toplam

SEO:
- seoTitle: en fazla 60 karakter, ana anahtar kelimeyi önde
- seoDescription: 120–155 karakter, tıklamayı teşvik eden doğal dil
- seoKeywords: 4–8 adet Türkçe anahtar kelime (dizi)

KAPAK / ÖNE ÇIKARMA (isFeatured):
- Kapak görseli mümkünse kaynak görselinden gelmeli
- Kapak yoksa içerik taslak/incelemede kalmalı; otomatik öne çıkarma yapılmaz
- isFeatured: yalnızca haber değeri yüksek VE kapak beklentisi varsa true öner; aksi halde false
- Sunucu kapaksız yayını/öne çıkarmayı engeller — sen yine de dürüst öner

KURALLAR:
- Asla birebir kopyalama
- Kaynak metni yeniden yaz, yeni yapı kullan
- Her paragraf benzersiz olsun
- Kaynak atfı gerekiyorsa en sonda belirt
- Etiketlerde # kullanma; yıl doğru olsun

ÇIKTI: Yalnızca geçerli JSON döndür.`;

export const AI_OUTPUT_JSON_SHAPE = `{
  "title": "Ana başlık (Türkçe)",
  "slug": "turkce-seo-slug",
  "headline": "Manşet — title'dan farklı kısa alt başlık",
  "summary": "2 cümle özet",
  "content": "Markdown gövde: lead paragraf + en az 3 ## bölüm + en az bir liste. # kullanma.",
  "excerpt": "Kart özeti",
  "tags": ["etiket1","etiket2","etiket3"],
  "artistName": "varsa sanatçı adı",
  "seoTitle": "SEO başlık (max 60 karakter)",
  "seoDescription": "SEO açıklama (120-155 karakter)",
  "seoKeywords": ["anahtar1","anahtar2","anahtar3","anahtar4"],
  "isFeatured": false
}`;

export const GENERAL_EDITOR: FeedEditorDefinition = {
  id: 'general',
  label: 'Genel Editör',
  defaultContentType: 'entertainment_news',
  specialtyPrompt: `GENEL ETKİNLİK ODAKLI:
- Haberin türüne göre (duyuru, özet, rehber) net H2'ler kur
- H2 örnekleri: "Ne Oluyor?", "Kimler İçin?", "Nasıl Katılınır?"`
};

export function buildSystemPrompt(editor: FeedEditorDefinition, extra?: string): string {
  return `${BASE_SYSTEM_PROMPT}\n\n${editor.specialtyPrompt}${extra ? `\n\n${extra}` : ''}`;
}

/** Gövdeye sızmış H1 (`# ...`) satırlarını temizler — yalnızca ## / ### kalır. */
export function stripLeakedH1(content: string): string {
  return content
    .split('\n')
    .filter((line) => !/^#\s+/.test(line.trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Başlık/manşet başındaki # işaretlerini temizler */
export function stripHashPrefix(text: string): string {
  return text.replace(/^#+\s*/, '').trim();
}

export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 200));
}

function cleanTag(tag: string): string {
  return tag.replace(/^#+/, '').trim();
}

function normalizeKeywords(raw: string[], fallbackTags: string[]): string[] {
  const fromAi = raw.map(cleanTag).filter(Boolean);
  const merged = (fromAi.length > 0 ? fromAi : fallbackTags.map(cleanTag)).filter(Boolean);
  return merged.slice(0, 8);
}

export function finalizeAiDraft(
  parsed: FeedAiOutput,
  defaults: {
    title: string;
    contentType: FeedPostType;
    tags?: string[];
    editor: FeedEditorDefinition;
    chat: Pick<AiChatResult, 'provider' | 'model'>;
  }
): AiEditorDraft {
  const title = stripHashPrefix(parsed.title) || defaults.title;
  const content = stripLeakedH1(parsed.content);
  const tags = (parsed.tags?.length ? parsed.tags : defaults.tags ?? [])
    .map(cleanTag)
    .filter(Boolean)
    .slice(0, 8);
  const slugSource = parsed.slug?.trim() || title;
  const slug = slugify(slugSource) || 'haber';

  return {
    title,
    slug,
    headline: stripHashPrefix(parsed.headline) || title,
    summary: parsed.summary?.trim() || parsed.excerpt?.trim() || '',
    content,
    excerpt: parsed.excerpt?.trim() || parsed.summary?.trim() || '',
    contentType: sanitizeContentType(parsed.contentType, defaults.contentType),
    tags,
    artistName: parsed.artistName?.trim() || undefined,
    seoTitle: stripHashPrefix(parsed.seoTitle || title).slice(0, 70),
    seoDescription: (parsed.seoDescription?.trim() || parsed.summary?.trim() || '').slice(0, 200),
    seoKeywords: normalizeKeywords(parsed.seoKeywords ?? [], tags),
    readingTimeMinutes: parsed.readingTimeMinutes ?? estimateReadingTime(content),
    isFeatured: parsed.isFeatured ?? false,
    meta: {
      editorId: defaults.editor.id,
      editorLabel: defaults.editor.label,
      provider: defaults.chat.provider,
      model: defaults.chat.model
    }
  };
}

export function parseAndFinalizeDraft(
  rawContent: string,
  defaults: {
    title: string;
    contentType: FeedPostType;
    tags?: string[];
    editor: FeedEditorDefinition;
    chat: Pick<AiChatResult, 'provider' | 'model'>;
  }
): AiEditorDraft {
  const json = extractJsonObject(rawContent);
  const parsed = parseFeedAiOutput(json);
  return finalizeAiDraft(parsed, defaults);
}

export function editorMetaForStorage(meta: AiEditorDraft['meta']): {
  editorId: FeedEditorId;
  editorLabel: string;
  ranAt: string;
} {
  return {
    editorId: meta.editorId,
    editorLabel: meta.editorLabel,
    ranAt: new Date().toISOString()
  };
}
