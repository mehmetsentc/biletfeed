/**
 * Banner görsel motoru v1: Sharp (sunucu) + CSS overlay — AI zorunlu değil.
 *
 * İsteğe bağlı AI entegrasyonları:
 * - Cloudinary (`CLOUDINARY_URL`) — generative fill, smart crop, otomatik banner
 * - Replicate (`REPLICATE_API_TOKEN`) — arka plan genişletme / upscale
 * - OpenAI (`OPENAI_API_KEY`) — promo metin varyasyonları (metin only)
 *
 * API anahtarı verildiğinde `lib/banners/ai-banner-enhance.ts` genişletilebilir.
 */
export const BANNER_AI_PROVIDERS = {
  cloudinary: 'CLOUDINARY_URL',
  replicate: 'REPLICATE_API_TOKEN',
  openaiCopy: 'OPENAI_API_KEY'
} as const;

export function isBannerAiConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_URL ||
      process.env.REPLICATE_API_TOKEN ||
      process.env.OPENAI_API_KEY
  );
}
