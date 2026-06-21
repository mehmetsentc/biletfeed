import type { AiChatMessage, AiChatOptions, AiProviderConfig } from '@/lib/ai/types';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

function resolveGeminiBaseUrl(): string {
  return (
    process.env.GEMINI_BASE_URL ||
    'https://generativelanguage.googleapis.com/v1beta'
  ).replace(/\/$/, '');
}

export async function geminiChat(
  provider: AiProviderConfig,
  messages: AiChatMessage[],
  options?: AiChatOptions
): Promise<string> {
  if (!provider.apiKey) {
    throw new Error('GEMINI_API_KEY tanımlı değil');
  }

  const systemInstruction = messages.find((m) => m.role === 'system')?.content;
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    }));

  const url = `${resolveGeminiBaseUrl()}/models/${provider.model}:generateContent?key=${provider.apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(systemInstruction
        ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
        : {}),
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.1,
        ...(options?.maxTokens ? { maxOutputTokens: options.maxTokens } : {}),
        ...(options?.jsonMode
          ? { responseMimeType: 'application/json' }
          : {})
      }
    })
  });

  const data = (await res.json()) as GeminiResponse;

  if (!res.ok) {
    throw new Error(data.error?.message || `gemini HTTP ${res.status}`);
  }

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('gemini yanıtı boş');
  }

  return content;
}
