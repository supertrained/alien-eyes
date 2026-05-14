import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type ModelTier = "opus" | "sonnet" | "haiku" | "openai-mini";

interface ModelConfig {
  provider: "anthropic" | "openai";
  model: string;
  maxTokens: number;
  costPer1MInput: number;
  costPer1MOutput: number;
}

const MODELS: Record<ModelTier, ModelConfig> = {
  opus: {
    provider: "anthropic",
    model: "claude-opus-4-6",
    maxTokens: 16384,
    costPer1MInput: 5,
    costPer1MOutput: 25,
  },
  sonnet: {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    maxTokens: 8192,
    costPer1MInput: 3,
    costPer1MOutput: 15,
  },
  haiku: {
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    maxTokens: 8192,
    costPer1MInput: 1,
    costPer1MOutput: 5,
  },
  "openai-mini": {
    provider: "openai",
    model: "gpt-4o-mini",
    maxTokens: 4096,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.6,
  },
};

export interface CompletionResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

interface CompletionOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

// Lazy-initialized clients
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI();
  }
  return openaiClient;
}

export async function complete(
  tier: ModelTier,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  options: CompletionOptions = {}
): Promise<CompletionResult> {
  const config = MODELS[tier];
  const maxTokens = options.maxTokens ?? config.maxTokens;

  if (config.provider === "anthropic") {
    const client = getAnthropic();
    const response = await client.messages.create({
      model: config.model,
      max_tokens: maxTokens,
      system: options.system,
      temperature: options.temperature,
      messages,
    });

    const content = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost =
      (inputTokens / 1_000_000) * config.costPer1MInput +
      (outputTokens / 1_000_000) * config.costPer1MOutput;

    return { content, usage: { inputTokens, outputTokens, cost } };
  }

  // OpenAI path
  const client = getOpenAI();
  const oaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (options.system) {
    oaiMessages.push({ role: "system", content: options.system });
  }
  for (const m of messages) {
    oaiMessages.push({ role: m.role, content: m.content });
  }

  const response = await client.chat.completions.create({
    model: config.model,
    max_tokens: maxTokens,
    temperature: options.temperature,
    messages: oaiMessages,
  });

  const content = response.choices[0]?.message?.content ?? "";
  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;
  const cost =
    (inputTokens / 1_000_000) * config.costPer1MInput +
    (outputTokens / 1_000_000) * config.costPer1MOutput;

  return { content, usage: { inputTokens, outputTokens, cost } };
}

export function getModelName(tier: ModelTier): string {
  return MODELS[tier].model;
}
