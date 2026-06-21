import {
  getProviderConfig,
  getScraperMaxHtmlChars,
  isAnyAiProviderReady,
  isProviderReady,
  resolvePrimaryProvider
} from '@/lib/ai/config';
import type { AiProviderId } from '@/lib/ai/types';

export interface ScraperAiConfig {
  enabled: boolean;
  provider: AiProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  maxHtmlChars: number;
}

export function getScraperAiConfig(): ScraperAiConfig {
  const provider = resolvePrimaryProvider();
  const providerConfig = getProviderConfig(provider);

  const baseUrl =
    provider === 'deepseek'
      ? process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
      : provider === 'gemini'
        ? process.env.GEMINI_BASE_URL ||
          'https://generativelanguage.googleapis.com/v1beta'
        : process.env.SCRAPER_AI_BASE_URL ||
          process.env.OPENAI_BASE_URL ||
          'https://api.openai.com/v1';

  return {
    enabled: providerConfig.enabled,
    provider,
    apiKey: providerConfig.apiKey,
    baseUrl: baseUrl.replace(/\/$/, ''),
    model: providerConfig.model,
    maxHtmlChars: getScraperMaxHtmlChars()
  };
}

export function isScraperAiReady(): boolean {
  return isAnyAiProviderReady();
}

export { isProviderReady, resolvePrimaryProvider };
