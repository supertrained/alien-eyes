import type { Finding } from '@/types';
import type { CrawlResult } from '@/types';
import type { ModelRouter } from '@/lib/llm/model-router';
import { buildStructuredPrompt } from '@/lib/llm/prompt-templates';

export async function generateNarrative(options: {
  findings: Finding[];
  crawl: CrawlResult;
  router?: ModelRouter;
}): Promise<string> {
  if (options.router) {
    const prompt = buildStructuredPrompt({
      task: 'Write a concise first-person audit narrative describing what a user would experience.',
      data: JSON.stringify({
        url: options.crawl.url,
        pagesCrawled: options.crawl.pages.length,
        findings: options.findings.map((finding) => ({
          severity: finding.severity,
          what: finding.what,
          where: finding.where,
          why: finding.why
        }))
      })
    });

    const completion = await options.router.complete('sonnet', [{ role: 'user', content: prompt.user }], {
      system: prompt.system,
      temperature: 0.2,
      primitive: 'narrative'
    });

    return completion.content.trim();
  }

  if (options.findings.length === 0) {
    return `I moved through ${options.crawl.url} without hitting obvious friction. The pages loaded, the structure held together, and nothing critical broke my path.`;
  }

  const [first, second, third] = options.findings;
  const parts = [
    `I moved through ${options.crawl.url} like a first-time visitor with no internal context.`,
    first
      ? `The first clear break was ${describeFinding(first)}.`
      : '',
    second
      ? `After that, ${describeFinding(second)}.`
      : '',
    third
      ? `I also ran into ${describeFinding(third)}.`
      : '',
    `Across ${options.crawl.pages.length} crawled page${options.crawl.pages.length === 1 ? '' : 's'}, the pattern was less about one broken screen and more about a handful of trust, structure, and discoverability gaps stacking together.`
  ].filter(Boolean);

  return parts.join(' ');
}

function describeFinding(finding: Finding): string {
  const location = finding.where ? `on ${finding.where}` : '';
  return `${finding.what.charAt(0).toLowerCase()}${finding.what.slice(1)} ${location}`.trim();
}
