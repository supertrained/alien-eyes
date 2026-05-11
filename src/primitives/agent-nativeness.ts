import type { AuditConfig, Finding, PageSummary } from '@/types';
import type { CrawlResult } from '@/types';
import { BasePrimitive, createFindingId, llmFindingSchema, withPrimitiveEnvelope } from '@/primitives/base';

const PASSIVE_ENDPOINTS = [
  { path: '/llms.txt', label: 'llms.txt guidance' },
  { path: '/openapi.json', label: 'OpenAPI description' },
  { path: '/.well-known/ai-plugin.json', label: 'AI plugin manifest' }
];

export class AgentNativenessPrimitive extends BasePrimitive {
  readonly name = 'agent-nativeness';
  readonly dimension = 'agent-nativeness' as const;
  readonly requiresOwnershipVerification = false;
  readonly usesLLM = true;
  private readonly fetchFn: typeof fetch;

  constructor(options: ConstructorParameters<typeof BasePrimitive>[0] & { fetchFn?: typeof fetch } = {}) {
    super(options);
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async run(crawl: CrawlResult, summaries: PageSummary[], config: AuditConfig) {
    return withPrimitiveEnvelope(this, config.methodologyVersion, async () => {
      const findings: Finding[] = [];
      let index = 1;
      const endpointSignals = summaries[0] ? await probeAgentEndpoints(summaries[0].url, this.fetchFn) : [];

      if (crawl.aiCrawlerDirectives && summaries[0]) {
        const blocked = crawl.aiCrawlerDirectives.filter((d) => d.blocked);
        const partiallyBlocked = crawl.aiCrawlerDirectives.filter((d) => !d.blocked && d.disallowedPaths.length > 0);

        if (blocked.length > 0) {
          const botList = blocked.map((d) => `${d.botName} (${d.platform})`).join(', ');
          findings.push(this.createFinding({
            page: summaries[0],
            id: createFindingId(this.name, index++),
            what: `robots.txt blocks ${blocked.length} AI crawler${blocked.length > 1 ? 's' : ''}: ${botList}.`,
            expected: 'Sites seeking AI visibility should allow major AI crawlers unless there is a specific reason to block them.',
            why: 'Blocked AI crawlers cannot index content, reducing the chance of appearing in AI-generated recommendations and answers.',
            verify: 'Review robots.txt User-agent directives and confirm each block is intentional.',
            severity: blocked.length >= 3 ? 'high' : 'medium',
            confidence: 0.96,
            requiresHumanJudgment: true,
            humanJudgmentReason: 'Blocking AI crawlers may be intentional (content protection, licensing) or accidental.'
          }));
        }

        if (partiallyBlocked.length > 0) {
          const botList = partiallyBlocked.map((d) => `${d.botName} (${d.disallowedPaths.join(', ')})`).join('; ');
          findings.push(this.createFinding({
            page: summaries[0],
            id: createFindingId(this.name, index++),
            what: `robots.txt partially restricts ${partiallyBlocked.length} AI crawler${partiallyBlocked.length > 1 ? 's' : ''}: ${botList}.`,
            expected: 'Partial restrictions should target non-public content, not pages that benefit from AI discoverability.',
            why: 'Restricted paths are invisible to the affected AI systems, which may fragment the brand representation.',
            verify: 'Confirm the restricted paths contain content that should not appear in AI systems.',
            severity: 'low',
            confidence: 0.85,
            requiresHumanJudgment: true,
            humanJudgmentReason: 'Partial restrictions require understanding of which content should be AI-accessible.'
          }));
        }
      }

      for (const summary of summaries) {
        if (summary.structuredData.length === 0) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'The page exposes no structured data for machine interpretation.',
            expected: 'Public product pages should provide structured hints where appropriate.',
            why: 'Structured data improves machine readability and downstream retrieval quality.',
            verify: 'Inspect the page and confirm JSON-LD or equivalent structured data is present where useful.',
            severity: 'low',
            confidence: 0.76,
            requiresHumanJudgment: true,
            humanJudgmentReason: 'Product-specific structured data needs manual interpretation.'
          }));
        }
        if (
          /robots\.txt$/i.test(summary.url) &&
          /#\s*llms\.txt:/i.test(summary.sanitizedTextContent)
        ) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'robots.txt comments out llms.txt guidance instead of exposing it as an active reference.',
            expected: 'Agent guidance files such as llms.txt should be explicitly referenced or the dead comments removed.',
            why: 'Commented-out machine guidance reduces discoverability for agent consumers looking for llms.txt hints.',
            verify: 'Inspect robots.txt and confirm llms.txt references are active or intentionally removed.',
            severity: 'low',
            confidence: 0.92,
            requiresHumanJudgment: false
          }));
        }
      }

      if (summaries[0]) {
        for (const endpoint of endpointSignals.filter((signal) => !signal.found)) {
          findings.push(this.createFinding({
            page: summaries[0],
            id: createFindingId(this.name, index++),
            what: `Public agent guidance endpoint ${endpoint.path} is missing.`,
            expected: `Agent-facing products should expose ${endpoint.label} when that surface exists or remove stale references to it.`,
            why: 'Discoverable machine-readable entry points reduce friction for agents, developers, and retrieval systems.',
            verify: `Request ${endpoint.path} directly and confirm the endpoint exists or the product intentionally omits that surface.`,
            severity: endpoint.path === '/llms.txt' ? 'low' : 'medium',
            confidence: 0.84,
            requiresHumanJudgment: endpoint.path !== '/llms.txt',
            humanJudgmentReason: endpoint.path !== '/llms.txt' ? 'Whether this product should expose that machine-readable surface depends on product scope.' : undefined
          }));
        }
      }

      if (config.tier === 'full_audit') {
        const llmFindings = await this.maybeGenerateLlmFindings({
          primitive: this.name,
          tier: 'opus',
          task: 'Find at most two agent-nativeness gaps in parity, composability, or machine readability.',
          summaries,
          schema: llmFindingSchema.array().max(2)
        });
        for (const llmFinding of llmFindings) {
          const page = summaries.find((summary) => summary.url === llmFinding.pageUrl);
          if (!page) {
            continue;
          }
          findings.push(this.createFinding({
            page,
            id: createFindingId(this.name, index++),
            what: llmFinding.what,
            expected: llmFinding.expected,
            why: llmFinding.why,
            verify: llmFinding.verify,
            severity: llmFinding.severity,
            confidence: llmFinding.confidence,
            requiresHumanJudgment: true,
            humanJudgmentReason: 'LLM-assisted agent-nativeness assessment.'
          }));
        }
      }

      return findings;
    });
  }
}

async function probeAgentEndpoints(pageUrl: string, fetchFn: typeof fetch): Promise<Array<{ path: string; label: string; found: boolean }>> {
  const origin = new URL(pageUrl).origin;
  const results = await Promise.all(
    PASSIVE_ENDPOINTS.map(async (endpoint) => {
      try {
        const response = await fetchFn(new URL(endpoint.path, origin), {
          method: 'GET',
          headers: { 'user-agent': 'AlienEyesBot/0.1 (+https://alieneyes.dev)' }
        });
        return {
          ...endpoint,
          found: response.ok
        };
      } catch {
        return {
          ...endpoint,
          found: false
        };
      }
    })
  );

  return results;
}
