export type AiProviderId = 'deepseek' | 'gemini' | 'openai';

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatOptions {
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface AiProviderConfig {
  id: AiProviderId;
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface AiChatResult {
  content: string;
  provider: AiProviderId;
  model: string;
}
