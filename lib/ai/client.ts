import {
  getProviderConfig,
  isProviderReady,
  resolveFallbackProvider,
  resolvePrimaryProvider
} from '@/lib/ai/config';
import { chatWithProvider } from '@/lib/ai/providers';
import type { AiChatMessage, AiChatOptions, AiChatResult, AiProviderId } from '@/lib/ai/types';

export async function aiChat(
  messages: AiChatMessage[],
  options?: AiChatOptions & {
    provider?: AiProviderId;
    allowFallback?: boolean;
  }
): Promise<AiChatResult> {
  const primary = options?.provider ?? resolvePrimaryProvider();
  const allowFallback = options?.allowFallback ?? true;
  const providers: AiProviderId[] = [primary];

  if (allowFallback) {
    const fallback = resolveFallbackProvider(primary);
    if (fallback) providers.push(fallback);
  }

  let lastError: Error | null = null;

  for (const providerId of providers) {
    if (!isProviderReady(providerId)) continue;

    try {
      const provider = getProviderConfig(providerId);
      const content = await chatWithProvider(providerId, messages, options);
      return {
        content,
        provider: providerId,
        model: provider.model
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('Kullanılabilir AI sağlayıcısı yok');
}
