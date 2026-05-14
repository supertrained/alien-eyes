import type { CrawlResult } from '@/types/crawl';
import type { Envelope } from '@/types/envelope';
import type { Finding } from '@/types/finding';
import type { PageSummary } from '@/types/page-summary';
import type { AuditConfig } from '@/types/primitive';
import type { ModelRouter } from '@/lib/llm/model-router';

export type PrimitiveType = 'crawl' | 'gather';
export type PrimitiveCategory = 'quality' | 'marketing';

export interface PrimitiveContext {
  domain: string;
  crawl?: CrawlResult;
  summaries?: PageSummary[];
  config: AuditConfig;
  router?: ModelRouter;
  previousResults?: Map<string, Envelope<Finding[]>>;
}

export interface PrimitiveDefinition {
  name: string;
  type: PrimitiveType;
  dimension: string;
  category: PrimitiveCategory;
  dependencies?: string[];
  requiresKeys?: string[];
  usesLLM: boolean;
  costEstimate: { min: number; max: number };
  run: (ctx: PrimitiveContext) => Promise<Envelope<Finding[]>>;
}

export class PrimitiveRegistry {
  private readonly primitives = new Map<string, PrimitiveDefinition>();

  register(definition: PrimitiveDefinition): void {
    if (this.primitives.has(definition.name)) {
      throw new Error(`Primitive "${definition.name}" already registered`);
    }
    this.primitives.set(definition.name, definition);
  }

  get(name: string): PrimitiveDefinition | undefined {
    return this.primitives.get(name);
  }

  list(): PrimitiveDefinition[] {
    return [...this.primitives.values()];
  }

  listByCategory(category: PrimitiveCategory): PrimitiveDefinition[] {
    return this.list().filter(p => p.category === category);
  }

  listByType(type: PrimitiveType): PrimitiveDefinition[] {
    return this.list().filter(p => p.type === type);
  }

  names(): string[] {
    return [...this.primitives.keys()];
  }

  has(name: string): boolean {
    return this.primitives.has(name);
  }

  needsCrawl(primitiveNames: string[]): boolean {
    return primitiveNames.some(name => {
      const p = this.primitives.get(name);
      return p?.type === 'crawl';
    });
  }

  resolveDependencies(primitiveNames: string[]): string[] {
    const resolved = new Set<string>();
    const visit = (name: string) => {
      if (resolved.has(name)) return;
      const p = this.primitives.get(name);
      if (!p) return;
      for (const dep of p.dependencies ?? []) {
        visit(dep);
      }
      resolved.add(name);
    };
    for (const name of primitiveNames) {
      visit(name);
    }
    return [...resolved];
  }

  checkRequiredKeys(primitiveNames: string[]): { name: string; missingKeys: string[] }[] {
    const issues: { name: string; missingKeys: string[] }[] = [];
    for (const name of primitiveNames) {
      const p = this.primitives.get(name);
      if (!p?.requiresKeys?.length) continue;
      const missing = p.requiresKeys.filter(k => !process.env[k]);
      if (missing.length > 0) {
        issues.push({ name, missingKeys: missing });
      }
    }
    return issues;
  }
}

const registry = new PrimitiveRegistry();
export default registry;
