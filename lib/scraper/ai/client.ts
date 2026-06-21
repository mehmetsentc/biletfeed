import { aiChat } from '@/lib/ai/client';
import { resolvePrimaryProvider } from '@/lib/ai/config';
import type { AiChatMessage } from '@/lib/ai/types';

export async function scraperAiChat(
  messages: AiChatMessage[],
  options?: { jsonMode?: boolean; temperature?: number }
): Promise<string> {
  const result = await aiChat(messages, {
    ...options,
    provider: resolvePrimaryProvider(),
    allowFallback: true
  });

  return result.content;
}

export { aiChat };
