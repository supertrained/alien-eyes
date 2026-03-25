export type ModelTier = 'opus' | 'sonnet' | 'haiku' | 'openai-mini';

export interface ModelConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  maxTokens: number;
  costPer1MInput: number;
  costPer1MOutput: number;
}

export interface CompletionResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}
