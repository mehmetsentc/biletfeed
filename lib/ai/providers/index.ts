import type { AiChatMessage, AiChatOptions, AiProviderId } from '@/lib/ai/types';
import { getProviderConfig } from '@/lib/ai/config';
import { geminiChat } from '@/lib/ai/providers/gemini';
import { openAiCompatibleChat } from '@/lib/ai/providers/openai-compatible';

export async function chatWithProvider(
  providerId: AiProviderId,
  messages: AiChatMessage[],
  options?: AiChatOptions
): Promise<string> {
  const provider = getProviderConfig(providerId);

  if (providerId === 'gemini') {
    return geminiChat(provider, messages, options);
  }

  return openAiCompatibleChat(provider, messages, options);
}
