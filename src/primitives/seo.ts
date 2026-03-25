import type { AuditConfig, Finding, PageSummary } from '@/types';
import type { CrawlResult } from '@/types';
import { BasePrimitive, createFindingId, llmFindingSchema, withPrimitiveEnvelope } from '@/primitives/base';

export class SeoPrimitive extends BasePrimitive {
  readonly name = 'seo';
  readonly dimension = 'seo' as const;
  readonly requiresOwnershipVerification = false;
  readonly usesLLM = true;

  async run(crawl: CrawlResult, summaries: PageSummary[], config: AuditConfig) {
    return withPrimitiveEnvelope(this, config.methodologyVersion, async () => {
      const findings: Finding[] = [];
      const titlePages = new Map<string, Set<string>>();
      const ogDescriptions = new Map<string, PageSummary[]>();

      summaries.forEach((summary) => {
        const title = summary.title.trim();
        if (title) {
          const urls = titlePages.get(title) ?? new Set<string>();
          urls.add(normalizePageIdentity(summary.url));
          titlePages.set(title, urls);
        }
        const ogDescription = summary.metaTags['og:description']?.trim();
        if (ogDescription) {
          ogDescriptions.set(ogDescription, [...(ogDescriptions.get(ogDescription) ?? []), summary]);
        }
      });

      let index = 1;
      for (const summary of summaries) {
        const canonical = summary.metaTags.canonical;
        if (!canonical) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Page is missing a canonical URL.',
            expected: 'Every indexable page should declare a canonical URL.',
            why: 'Search engines can split ranking signals across duplicate URLs when canonical is absent.',
            verify: 'Inspect the page head and confirm a canonical link is present and self-referential.',
            severity: 'medium',
            confidence: 0.95
          }));
        } else if (isWrongCanonical(summary.url, canonical)) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `Canonical URL points to ${canonical} instead of this page.`,
            expected: 'Each page should canonicalize to itself unless it is intentionally a duplicate.',
            why: 'Wrong canonicals can collapse multiple pages into one indexable URL.',
            verify: 'Check the canonical tag and confirm it matches the page URL after deploy.',
            severity: 'critical',
            confidence: 0.98
          }));
        }
        if (!summary.metaTags.description) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Page is missing a meta description.',
            expected: 'Every landing page should provide a unique meta description.',
            why: 'Missing descriptions reduce control over search snippets and CTR.',
            verify: 'Check the head for a populated meta description after deploy.',
            severity: 'medium',
            confidence: 0.98
          }));
        } else {
          const descriptionLength = summary.metaTags.description.trim().length;
          if (descriptionLength < 70 || descriptionLength > 160) {
            findings.push(this.createFinding({
              page: summary,
              id: createFindingId(this.name, index++),
              what: `meta description length is ${descriptionLength} characters, outside the recommended range.`,
              expected: 'Primary pages should keep meta descriptions roughly within a 70-160 character range.',
              why: 'Descriptions that are too short or too long reduce snippet control and clarity in search results.',
              verify: 'Inspect the meta description after deploy and confirm it is concise, specific, and within a normal snippet length.',
              severity: 'low',
              confidence: 0.9
            }));
          }
        }
        const titleLength = summary.title.trim().length;
        if (titleLength < 30 || titleLength > 60) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: `Page title length is ${titleLength} characters, outside the recommended range.`,
            expected: 'Important pages should keep titles roughly within a 30-60 character range.',
            why: 'Titles that are too short waste ranking real estate, while very long titles are truncated.',
            verify: 'Inspect document.title and confirm the final title is concise, distinctive, and within best-practice length.',
            severity: 'low',
            confidence: 0.9
          }));
        }
        if (!summary.metaTags['og:title']) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Open Graph title is missing.',
            expected: 'Shareable pages should define og:title for consistent previews.',
            why: 'Missing OG metadata degrades social previews and distribution quality.',
            verify: 'Fetch the page HTML and confirm og:title is present.',
            severity: 'low',
            confidence: 0.9
          }));
        }
        if (hasHeadingGap(summary)) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Heading hierarchy skips levels.',
            expected: 'Heading levels should progress without large jumps.',
            why: 'Broken heading structure weakens information architecture for crawlers and assistive tech.',
            verify: 'Review the heading outline and ensure levels move sequentially.',
            severity: 'medium',
            confidence: 0.88
          }));
        }
        if ((titlePages.get(summary.title.trim())?.size ?? 0) > 1) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Page title duplicates another crawled page title.',
            expected: 'Important pages should have distinct titles.',
            why: 'Duplicate titles reduce topical clarity and waste ranking opportunities.',
            verify: 'Compare crawled titles and confirm each page now has a unique title.',
            severity: 'medium',
            confidence: 0.87
          }));
        }
        if (hasDuplicateBrand(summary.title)) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Page title repeats the brand name.',
            expected: 'Title tags should include the brand at most once.',
            why: 'Duplicate brand terms waste title space and look low-quality in search results.',
            verify: 'Inspect document.title and confirm the brand appears only once.',
            severity: 'low',
            confidence: 0.84
          }));
        }
        if (hasInvalidStructuredData(summary)) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'structured data is missing required schema fields or contains invalid JSON-LD.',
            expected: 'Structured data blocks should include valid JSON-LD with @context and @type where applicable.',
            why: 'Broken structured data reduces machine readability and can invalidate rich-result eligibility.',
            verify: 'Validate the JSON-LD and confirm each relevant block includes valid @context and @type fields.',
            severity: 'medium',
            confidence: 0.93
          }));
        }
      }

      for (const [description, pages] of ogDescriptions.entries()) {
        if (pages.length <= 1 || !description) {
          continue;
        }
        findings.push(this.createFinding({
          page: pages[0]!,
          id: createFindingId(this.name, index++),
          what: 'Open Graph description is reused across multiple pages.',
          expected: 'Each important page should have a page-specific OG description.',
          why: 'Generic shared OG descriptions weaken social previews and make page intent harder to distinguish.',
          verify: 'Compare og:description tags across the audited pages and confirm each is page-specific.',
          severity: 'low',
          confidence: 0.8
        }));
      }

      const sitemapUrls = new Set((crawl.sitemapUrls ?? []).map(normalizePageIdentity));
      if (sitemapUrls.size > 0) {
        const crawledUrls = new Set(summaries.map((summary) => normalizePageIdentity(summary.url)));
        const missingFromCrawl = [...sitemapUrls].filter((url) => !crawledUrls.has(url));
        if (missingFromCrawl.length > 0 && summaries[0]) {
          findings.push(this.createFinding({
            page: summaries[0],
            id: createFindingId(this.name, index++),
            what: `${missingFromCrawl.length} sitemap URL${missingFromCrawl.length > 1 ? 's were' : ' was'} not crawled or linked during the audit.`,
            expected: 'Important sitemap URLs should be internally discoverable and auditable from the main site graph.',
            why: 'Pages present only in the sitemap can be effectively orphaned or hidden from normal site navigation.',
            verify: 'Compare sitemap.xml against the internal link graph and confirm key sitemap URLs are reachable from the site.',
            severity: 'medium',
            confidence: 0.88
          }));
        }
      }

      const inboundCounts = computeInboundCounts(summaries);
      for (const summary of summaries) {
        if ((summary.pageRole ?? 'other') === 'homepage') {
          continue;
        }
        if ((inboundCounts.get(normalizePageIdentity(summary.url)) ?? 0) === 0) {
          findings.push(this.createFinding({
            page: summary,
            id: createFindingId(this.name, index++),
            what: 'Page appears orphaned from the internal link graph.',
            expected: 'Important pages should receive at least one internal link from another crawled page.',
            why: 'Orphaned pages are harder for users and crawlers to discover, weakening crawl efficiency and topical coherence.',
            verify: 'Inspect internal navigation and confirm at least one other page links to this URL.',
            severity: 'medium',
            confidence: 0.85
          }));
        }
      }

      if (config.tier === 'full_audit') {
        const llmFindings = await this.maybeGenerateLlmFindings({
          primitive: this.name,
          tier: 'sonnet',
          task: 'Find at most two SEO-quality issues that deterministic checks may miss.',
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
            humanJudgmentReason: 'LLM-assisted SEO quality assessment.'
          }));
        }
      }

      return findings;
    });
  }
}

function hasHeadingGap(summary: PageSummary): boolean {
  let previousLevel = 0;
  for (const heading of summary.headings) {
    if (previousLevel && heading.level - previousLevel > 1) {
      return true;
    }
    previousLevel = heading.level;
  }
  return false;
}

function isWrongCanonical(pageUrl: string, canonical: string): boolean {
  try {
    const page = new URL(pageUrl);
    const resolvedCanonical = new URL(canonical, page).toString();
    page.hash = '';
    page.search = '';
    const normalizedPage = page.toString().replace(/\/$/, '');
    const normalizedCanonical = resolvedCanonical.replace(/\/$/, '');
    return normalizedPage !== normalizedCanonical;
  } catch {
    return false;
  }
}

function hasDuplicateBrand(title: string): boolean {
  const segments = title
    .split('|')
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);
  return new Set(segments).size !== segments.length;
}

function hasInvalidStructuredData(summary: PageSummary): boolean {
  if (summary.structuredData.length === 0) {
    return false;
  }

  return summary.structuredData.some((item) => {
    if (!item || typeof item !== 'object') {
      return true;
    }
    if (item.type === 'invalid-json-ld') {
      return true;
    }
    return typeof item['@context'] !== 'string' || typeof item['@type'] !== 'string';
  });
}

function computeInboundCounts(summaries: PageSummary[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const summary of summaries) {
    counts.set(normalizePageIdentity(summary.url), counts.get(normalizePageIdentity(summary.url)) ?? 0);
  }

  for (const source of summaries) {
    for (const link of source.links.filter((candidate) => candidate.isInternal)) {
      try {
        const target = normalizePageIdentity(new URL(link.href, source.url).toString());
        if (target === normalizePageIdentity(source.url)) {
          continue;
        }
        counts.set(target, (counts.get(target) ?? 0) + 1);
      } catch {
        continue;
      }
    }
  }

  return counts;
}

function normalizePageIdentity(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    if (parsed.pathname !== '/') {
      parsed.pathname = parsed.pathname.replace(/\/$/, '');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
