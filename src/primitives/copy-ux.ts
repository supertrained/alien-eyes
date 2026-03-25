import type { AuditConfig, Finding, PageSummary } from '@/types';
import type { CrawlResult } from '@/types';
import { BasePrimitive, createFindingId, llmFindingSchema, withPrimitiveEnvelope } from '@/primitives/base';

const CTA_PATTERNS = ['start', 'book', 'contact', 'try', 'get', 'request', 'demo', 'sign up'];
const TRUST_PATTERNS = ['trusted by', 'customer', 'review', 'case study', 'security', 'privacy', 'testimonial'];
const CTA_ROLES = new Set(['homepage', 'services', 'pricing', 'product', 'contact']);
const CTA_TEXT_PATTERNS = /(start|get|book|contact|request|demo|sign up|apply|talk|schedule|buy|learn|explore|try|see|view|discover|join|subscribe|download|free|pricing)/i;

export class CopyUxPrimitive extends BasePrimitive {
  readonly name = 'copy-ux';
  readonly dimension = 'ux' as const;
  readonly requiresOwnershipVerification = false;
  readonly usesLLM = true;

  async run(_crawl: CrawlResult, summaries: PageSummary[], config: AuditConfig) {
    return withPrimitiveEnvelope(this, config.methodologyVersion, async () => {
      const findings: Finding[] = [];
      let index = 1;

      for (const summary of summaries) {
        const text = summary.sanitizedTextContent.toLowerCase();
        const interactiveCtas = (summary.interactiveElements ?? []).filter((element) =>
          CTA_TEXT_PATTERNS.test(`${element.text} ${element.accessibleName ?? ''}`)
        );
        const needsPrimaryCta = CTA_ROLES.has(summary.pageRole ?? 'other');
        const hasTextCta = CTA_PATTERNS.some((pattern) => text.includes(pattern));

        if (needsPrimaryCta && interactiveCtas.length === 0 && !hasTextCta) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Page does not present a clear call to action in visible copy.',
            expected: 'Primary pages should make the next step explicit.',
            why: 'Visitors hesitate when the product does not clearly tell them what to do next.',
            verify: 'Review the hero and primary sections and confirm a single obvious next action is present.',
            severity: 'medium',
            confidence: 0.8
          }));
        }
        const trustSignals = summary.trustSignals ?? {
          testimonialCount: 0,
          logoCount: 0,
          reviewCount: 0,
          caseStudyLinkCount: 0
        };
        const hasStructuralTrust = trustSignals.testimonialCount > 0 ||
          trustSignals.logoCount > 0 ||
          trustSignals.reviewCount > 0 ||
          trustSignals.caseStudyLinkCount > 0 ||
          summary.structuredData.some((item) => typeof item?.['@type'] === 'string' && /Organization|Review|AggregateRating/i.test(item['@type']));

        if (!hasStructuralTrust && !TRUST_PATTERNS.some((pattern) => text.includes(pattern))) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Page provides weak trust reinforcement.',
            expected: 'Decision pages should surface concrete trust signals such as customers, reviews, privacy, or proof.',
            why: 'Without trust cues, evaluators have to take the product on faith.',
            verify: 'Confirm the page now includes at least one concrete trust signal visible without deep exploration.',
            severity: 'low',
            confidence: 0.75
          }));
        }
        if (summary.links.length === 0) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Page is a dead end with no visible navigational links.',
            expected: 'Users should have an obvious next step from every key page.',
            why: 'Dead-end pages create friction and abandonments.',
            verify: 'Confirm the page now offers a clear onward path through navigation or CTA links.',
            severity: 'medium',
            confidence: 0.9
          }));
        }
      }

      if (config.tier === 'full_audit') {
        const llmFindings = await this.maybeGenerateLlmFindings({
          primitive: this.name,
          tier: 'sonnet',
          task: 'Find at most two copy or UX clarity issues around value proposition, navigation, or friction.',
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
            humanJudgmentReason: 'LLM-assisted copy and UX judgment.'
          }));
        }
      }

      return findings;
    });
  }
}
