import type { AiProviderConfig, AiProviderId } from '@/lib/ai/types';

const PROVIDER_ENV_KEYS: Record<AiProviderId, string[]> = {
  deepseek: ['DEEPSEEK_API_KEY'],
  gemini: ['GEMINI_API_KEY', 'GOOGLE_GEMINI_API_KEY'],
  openai: ['OPENAI_API_KEY', 'SCRAPER_AI_API_KEY', 'AI_API_KEY']
};

const PROVIDER_DEFAULT_MODELS: Record<AiProviderId, string> = {
  deepseek: 'deepseek-chat',
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini'
};

const PROVIDER_MODEL_ENV: Record<AiProviderId, string> = {
  deepseek: 'DEEPSEEK_MODEL',
  gemini: 'GEMINI_MODEL',
  openai: 'OPENAI_MODEL'
};

function readApiKey(provider: AiProviderId): string {
  for (const envKey of PROVIDER_ENV_KEYS[provider]) {
    const value = process.env[envKey]?.trim();
    if (value) return value;
  }
  return '';
}

function isAiEnabled(): boolean {
  return (
    process.env.AI_ENABLED === 'true' ||
    process.env.AI_ENABLED === '1' ||
    process.env.SCRAPER_AI_ENABLED === 'true' ||
    process.env.SCRAPER_AI_ENABLED === '1'
  );
}

export function parseProviderId(value?: string | null): AiProviderId | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'deepseek' || normalized === 'gemini' || normalized === 'openai') {
    return normalized;
  }
  return null;
}

export function getProviderConfig(provider: AiProviderId): AiProviderConfig {
  const modelEnv = PROVIDER_MODEL_ENV[provider];
  const model =
    process.env[modelEnv]?.trim() ||
    (provider === 'openai'
      ? process.env.SCRAPER_AI_MODEL?.trim() || process.env.OPENAI_MODEL?.trim()
      : undefined) ||
    PROVIDER_DEFAULT_MODELS[provider];

  return {
    id: provider,
    apiKey: readApiKey(provider),
    model,
    enabled: isAiEnabled()
  };
}

export function resolvePrimaryProvider(): AiProviderId {
  const explicit =
    parseProviderId(process.env.AI_PROVIDER) ||
    parseProviderId(process.env.SCRAPER_AI_PROVIDER);

  if (explicit) return explicit;

  const legacyBaseUrl = process.env.SCRAPER_AI_BASE_URL?.toLowerCase() || '';
  if (legacyBaseUrl.includes('deepseek')) return 'deepseek';
  if (legacyBaseUrl.includes('generativelanguage.googleapis.com')) return 'gemini';

  if (readApiKey('deepseek')) return 'deepseek';
  if (readApiKey('gemini')) return 'gemini';
  if (readApiKey('openai')) return 'openai';

  return 'deepseek';
}

export function resolveFallbackProvider(
  primary: AiProviderId
): AiProviderId | null {
  const explicit = parseProviderId(
    process.env.AI_FALLBACK_PROVIDER ||
      process.env.SCRAPER_AI_FALLBACK_PROVIDER
  );

  if (explicit && explicit !== primary && readApiKey(explicit)) {
    return explicit;
  }

  const order: AiProviderId[] = ['deepseek', 'gemini', 'openai'];
  for (const candidate of order) {
    if (candidate !== primary && readApiKey(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function isProviderReady(provider: AiProviderId): boolean {
  const cfg = getProviderConfig(provider);
  return cfg.enabled && cfg.apiKey.length > 0;
}

export function isAnyAiProviderReady(): boolean {
  if (!isAiEnabled()) return false;
  return (
    isProviderReady('deepseek') ||
    isProviderReady('gemini') ||
    isProviderReady('openai')
  );
}

export function getScraperMaxHtmlChars(): number {
  return parseInt(process.env.SCRAPER_AI_MAX_HTML_CHARS || '48000', 10);
}
