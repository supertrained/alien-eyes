import type { AuditConfig, Finding, PageSummary } from '@/types';
import type { CrawlResult } from '@/types';
import { BasePrimitive, createFindingId, llmFindingSchema, withPrimitiveEnvelope } from '@/primitives/base';

export class AccessibilityPrimitive extends BasePrimitive {
  readonly name = 'accessibility';
  readonly dimension = 'accessibility' as const;
  readonly requiresOwnershipVerification = false;
  readonly usesLLM = true;

  async run(_crawl: CrawlResult, summaries: PageSummary[], config: AuditConfig) {
    return withPrimitiveEnvelope(this, config.methodologyVersion, async () => {
      const findings: Finding[] = [];
      let index = 1;

      for (const summary of summaries) {
        const missingAlt = summary.images.filter((image) => !image.hasAlt && !image.isDecorative);
        if (missingAlt.length > 0) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `${missingAlt.length} image${missingAlt.length > 1 ? 's are' : ' is'} missing alt text.`,
            expected: 'Informative images should include meaningful alt text.',
            why: 'Screen-reader users lose essential content when images have no alt text.',
            verify: 'Inspect each image element and confirm a non-empty alt attribute is present where needed.',
            severity: 'high',
            confidence: 0.98
          }));
        }
        if (summary.ariaLandmarks.length === 0) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Page exposes no ARIA or native landmarks.',
            expected: 'Key page regions should expose native landmarks such as main and nav.',
            why: 'Landmarks help assistive technology users navigate page structure quickly.',
            verify: 'Audit the DOM and confirm the page exposes at least main and navigation landmarks.',
            severity: 'medium',
            confidence: 0.9
          }));
        }
        if (!summary.links.some((link) => /skip/i.test(link.text))) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Page has no visible skip-to-content link.',
            expected: 'Keyboard users should be able to bypass repeated navigation.',
            why: 'Without a skip link, keyboard navigation is slower and more frustrating.',
            verify: 'Tab from the top of the page and confirm a skip link appears and moves focus into main content.',
            severity: 'medium',
            confidence: 0.82
          }));
        }
        if (summary.ariaLandmarks.some((landmark) => landmark.role.endsWith('-inside-main'))) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Navigation or footer landmarks are nested inside the main landmark.',
            expected: 'Header/nav, main, and footer landmarks should be siblings rather than nesting navigation or footer inside main.',
            why: 'Incorrect landmark structure makes keyboard and screen-reader navigation less reliable.',
            verify: 'Inspect the DOM and confirm nav and footer are no longer children of main.',
            severity: 'medium',
            confidence: 0.92
          }));
        }

        for (const issue of summary.contrastIssues ?? []) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `Text contrast falls to ${issue.ratio}:1 for "${issue.text}".`,
            expected: issue.largeText
              ? 'Large text should maintain at least a 3:1 contrast ratio.'
              : 'Normal text should maintain at least a 4.5:1 contrast ratio.',
            why: `Low contrast makes text harder to read, especially for low-vision users (WCAG 1.4.3${issue.largeText ? ' / 1.4.6' : ''}).`,
            verify: 'Inspect computed foreground/background colors and confirm the text now meets WCAG 1.4.3 contrast thresholds.',
            severity: issue.largeText ? 'medium' : 'high',
            confidence: 0.95
          }));
        }

        const unnamedControls = findUnnamedInteractiveNodes(summary.accessibilityTree);
        if (unnamedControls.length > 0) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `${unnamedControls.length} interactive element${unnamedControls.length > 1 ? 's expose' : ' exposes'} no accessible name.`,
            expected: 'Buttons, links, and form controls should expose a non-empty accessible name.',
            why: 'Unnamed interactive controls are ambiguous or silent for assistive technology users (WCAG 4.1.2).',
            verify: 'Inspect the accessibility tree and confirm every interactive control has a programmatic accessible name per WCAG 4.1.2.',
            severity: 'high',
            confidence: 0.96
          }));
        }
      }

      if (config.tier === 'full_audit') {
        const llmFindings = await this.maybeGenerateLlmFindings({
          primitive: this.name,
          tier: 'haiku',
          task: 'Find at most two accessibility quality issues in labels, alt text quality, or semantic structure.',
          summaries,
          schema: llmFindingSchema.array().max(2)
        });
        let offset = findings.length + 1;
        for (const llmFinding of llmFindings) {
          const page = summaries.find((summary) => summary.url === llmFinding.pageUrl);
          if (!page) {
            continue;
          }
          findings.push(this.createFinding({
            page,
            id: createFindingId(this.name, offset++),
            what: llmFinding.what,
            expected: llmFinding.expected,
            why: llmFinding.why,
            verify: llmFinding.verify,
            severity: llmFinding.severity,
            confidence: llmFinding.confidence,
            requiresHumanJudgment: true,
            humanJudgmentReason: 'LLM-assisted accessibility quality assessment.'
          }));
        }
      }

      return findings;
    });
  }
}

function findUnnamedInteractiveNodes(node: PageSummary['accessibilityTree']): Array<{ role: string }> {
  if (!node) {
    return [];
  }

  const unnamed: Array<{ role: string }> = [];
  const stack = [node];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const role = current.role?.toLowerCase?.() ?? '';
    if (['button', 'link', 'textbox', 'searchbox', 'combobox', 'checkbox', 'radio', 'switch'].includes(role)) {
      if (!current.name || !current.name.trim()) {
        unnamed.push({ role: current.role });
      }
    }
    for (const child of current.children ?? []) {
      stack.push(child);
    }
  }

  return unnamed;
}
