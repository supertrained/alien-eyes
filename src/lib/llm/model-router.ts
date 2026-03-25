import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ZodError, type ZodSchema } from 'zod';
import type { CompletionResult, ModelConfig, ModelTier } from '@/types';
import { AuditCostTracker } from '@/lib/llm/cost-tracker';

const MODELS: Record<ModelTier, ModelConfig> = {
  opus: {
    provider: 'anthropic',
    model: 'claude-opus-4-6',
    maxTokens: 16_384,
    costPer1MInput: 15,
    costPer1MOutput: 75
  },
  sonnet: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-5',
    maxTokens: 8_192,
    costPer1MInput: 3,
    costPer1MOutput: 15
  },
  haiku: {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-latest',
    maxTokens: 8_192,
    costPer1MInput: 0.8,
    costPer1MOutput: 4
  },
  'openai-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    maxTokens: 4_096,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.6
  }
};

interface CompletionOptions {
  system?: string;
  temperature?: number;
  maxTokens?: number;
  primitive?: string;
}

interface ModelRouterOptions {
  anthropic?: Pick<Anthropic, 'messages'>;
  openai?: { chat: { completions: { create: OpenAI['chat']['completions']['create'] } } };
  costTracker?: AuditCostTracker;
}

export class ModelRouter {
  private anthropicClient?: Pick<Anthropic, 'messages'>;
  private openaiClient?: { chat: { completions: { create: OpenAI['chat']['completions']['create'] } } };
  private readonly costTracker: AuditCostTracker;

  constructor(options: ModelRouterOptions = {}) {
    this.anthropicClient = options.anthropic;
    this.openaiClient = options.openai;
    this.costTracker = options.costTracker ?? new AuditCostTracker();
  }

  getConfig(tier: ModelTier): ModelConfig {
    return MODELS[tier];
  }

  async complete(
    tier: ModelTier,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options: CompletionOptions = {}
  ): Promise<CompletionResult> {
    const config = MODELS[tier];
    const maxTokens = options.maxTokens ?? config.maxTokens;

    let result: CompletionResult;
    if (config.provider === 'anthropic') {
      const client = this.getAnthropic();
      const response = await client.messages.create({
        model: config.model,
        max_tokens: maxTokens,
        temperature: options.temperature,
        system: options.system,
        messages
      });

      const content = response.content
        .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
        .map((block) => block.text)
        .join('');
      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      result = {
        content,
        usage: {
          inputTokens,
          outputTokens,
          cost: computeCost(config, inputTokens, outputTokens)
        }
      };
    } else {
      const client = this.getOpenAI();
      const openAiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (options.system) {
        openAiMessages.push({ role: 'system', content: options.system });
      }
      for (const message of messages) {
        openAiMessages.push({ role: message.role, content: message.content });
      }

      const response = await client.chat.completions.create({
        model: config.model,
        max_tokens: maxTokens,
        temperature: options.temperature,
        messages: openAiMessages
      });

      const inputTokens = response.usage?.prompt_tokens ?? 0;
      const outputTokens = response.usage?.completion_tokens ?? 0;
      result = {
        content: response.choices[0]?.message?.content ?? '',
        usage: {
          inputTokens,
          outputTokens,
          cost: computeCost(config, inputTokens, outputTokens)
        }
      };
    }

    this.costTracker.record(options.primitive ?? tier, result.usage.cost);
    return result;
  }

  async completeJson<T>(options: {
    tier: ModelTier;
    schema: ZodSchema<T>;
    system?: string;
    prompt: string;
    temperature?: number;
    primitive?: string;
  }): Promise<{ data: T; completion: CompletionResult; repaired: boolean }> {
    let repaired = false;
    let completion = await this.complete(
      options.tier,
      [{ role: 'user', content: options.prompt }],
      {
        system: options.system,
        temperature: options.temperature,
        primitive: options.primitive
      }
    );

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const repairedContent = repairJson(completion.content);
        repaired = repaired || repairedContent !== completion.content.trim();
        return {
          data: options.schema.parse(JSON.parse(repairedContent)),
          completion,
          repaired
        };
      } catch (error) {
        if (!(error instanceof SyntaxError) && !(error instanceof ZodError)) {
          throw error;
        }

        repaired = true;
        if (attempt === 2) {
          throw error;
        }

        completion = {
          ...completion,
          content: repairJson(completion.content)
        };
      }
    }

    throw new Error('JSON repair loop exhausted');
  }

  getCostSnapshot() {
    return this.costTracker.snapshot();
  }

  private getAnthropic(): Pick<Anthropic, 'messages'> {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return this.anthropicClient;
  }

  private getOpenAI(): { chat: { completions: { create: OpenAI['chat']['completions']['create'] } } } {
    if (!this.openaiClient) {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      this.openaiClient = { chat: { completions: { create: client.chat.completions.create.bind(client.chat.completions) } } };
    }
    return this.openaiClient;
  }
}

function computeCost(config: ModelConfig, inputTokens: number, outputTokens: number): number {
  return Number(((inputTokens / 1_000_000) * config.costPer1MInput + (outputTokens / 1_000_000) * config.costPer1MOutput).toFixed(6));
}

function repairJson(content: string): string {
  let repaired = content.trim();
  const firstBrace = repaired.indexOf('{');
  const firstBracket = repaired.indexOf('[');
  const firstIndex = [firstBrace, firstBracket].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? 0;
  repaired = repaired.slice(firstIndex);
  repaired = repaired.replace(/```json|```/gi, '').trim();
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');

  const openCurly = (repaired.match(/\{/g) ?? []).length;
  const closeCurly = (repaired.match(/\}/g) ?? []).length;
  if (openCurly > closeCurly) {
    repaired += '}'.repeat(openCurly - closeCurly);
  }

  const openSquare = (repaired.match(/\[/g) ?? []).length;
  const closeSquare = (repaired.match(/\]/g) ?? []).length;
  if (openSquare > closeSquare) {
    repaired += ']'.repeat(openSquare - closeSquare);
  }

  return repaired;
}
