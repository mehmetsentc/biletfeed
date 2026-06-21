import type { AiChatMessage, AiChatOptions, AiProviderConfig } from '@/lib/ai/types';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
}

const PROVIDER_BASE_URLS = {
  deepseek: 'https://api.deepseek.com/v1',
  openai: 'https://api.openai.com/v1'
} as const;

function resolveBaseUrl(provider: AiProviderConfig['id']): string {
  if (provider === 'deepseek') {
    return (process.env.DEEPSEEK_BASE_URL || PROVIDER_BASE_URLS.deepseek).replace(
      /\/$/,
      ''
    );
  }

  return (
    process.env.SCRAPER_AI_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    PROVIDER_BASE_URLS.openai
  ).replace(/\/$/, '');
}

export async function openAiCompatibleChat(
  provider: AiProviderConfig,
  messages: AiChatMessage[],
  options?: AiChatOptions
): Promise<string> {
  if (!provider.apiKey) {
    throw new Error(`${provider.id} API anahtarı tanımlı değil`);
  }

  const baseUrl = resolveBaseUrl(provider.id);
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: options?.temperature ?? 0.1,
      ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
      ...(options?.jsonMode
        ? { response_format: { type: 'json_object' } }
        : {})
    })
  });

  const data = (await res.json()) as ChatCompletionResponse;

  if (!res.ok) {
    throw new Error(data.error?.message || `${provider.id} HTTP ${res.status}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`${provider.id} yanıtı boş`);
  }

  return content;
}
