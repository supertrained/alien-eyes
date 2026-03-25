import type { FieldNote } from '@/orchestrator/field-notes';

type NoteInput = Omit<FieldNote, 'seq' | 'elapsedMs'>;

export function commentOnValidation(
  hostname: string,
  isHttps: boolean,
  resolveMs: number
): NoteInput[] {
  const notes: NoteInput[] = [];

  notes.push({
    phase: 'validating',
    subject: hostname,
    observed: `${hostname} resolves in ${resolveMs}ms.`,
    signal: resolveMs > 3000 ? 'notable' : 'expected',
    context: resolveMs > 3000 ? 'DNS is sluggish — could affect real visitors too.' : undefined,
  });

  if (!isHttps) {
    notes.push({
      phase: 'validating',
      subject: 'protocol',
      observed: 'No HTTPS. Serving over plain HTTP.',
      signal: 'surprising',
      context: 'Browsers will flag this. Search engines will penalize it.',
    });
  }

  return notes;
}

export function commentOnCrawlStart(): NoteInput[] {
  return [{
    phase: 'crawling',
    subject: 'browser',
    observed: 'Opening a clean browser — no cookies, no cache. Just like a first-time visitor.',
    signal: 'expected',
  }];
}

export function commentOnPageCrawled(data: {
  url: string;
  pageNumber: number;
  totalQueued: number;
  loadTimeMs: number;
  errorCount: number;
  pageWeight?: number;
}): NoteInput[] {
  const notes: NoteInput[] = [];
  const path = extractPath(data.url);

  if (data.pageNumber === 1) {
    if (data.loadTimeMs > 2000) {
      notes.push({
        phase: 'crawling',
        subject: path,
        observed: `Homepage loaded in ${data.loadTimeMs}ms. That felt slow.`,
        signal: 'notable',
        context: 'First impressions matter — visitors and search engines both notice.',
      });
    } else {
      notes.push({
        phase: 'crawling',
        subject: path,
        observed: `Homepage loaded in ${data.loadTimeMs}ms. Quick.`,
        signal: 'expected',
      });
    }
  } else if (data.pageNumber % 5 === 0 || data.totalQueued <= 1) {
    if (data.totalQueued <= 1) {
      notes.push({
        phase: 'crawling',
        subject: 'site graph',
        observed: `${data.pageNumber} pages in. Site graph is tightening up.`,
        signal: 'expected',
      });
    } else {
      notes.push({
        phase: 'crawling',
        subject: 'site graph',
        observed: `${data.pageNumber} pages in. Still discovering links.`,
        signal: 'expected',
      });
    }
  }

  if (data.loadTimeMs > 4000 && data.pageNumber > 1) {
    notes.push({
      phase: 'crawling',
      subject: path,
      observed: `${path} took ${data.loadTimeMs}ms to load.`,
      signal: 'surprising',
      context: 'That is well past the patience threshold for most visitors.',
    });
  }

  if (data.errorCount > 0 && data.pageNumber === 1) {
    notes.push({
      phase: 'crawling',
      subject: 'console',
      observed: `${data.errorCount} console error${data.errorCount > 1 ? 's' : ''} on the homepage.`,
      signal: 'notable',
      context: 'Visitors do not see these, but agents and developers do.',
    });
  }

  if (data.pageWeight && data.pageWeight > 3_000_000) {
    const mb = (data.pageWeight / 1_000_000).toFixed(1);
    notes.push({
      phase: 'crawling',
      subject: path,
      observed: `Page weighs ${mb}MB.`,
      signal: 'surprising',
      context: 'Heavy pages punish mobile visitors on slow connections.',
    });
  }

  return notes;
}

export function commentOnCrawlComplete(data: {
  pageCount: number;
  pagesSkipped: number;
  robotsTxtStatus: string;
  detectedStack: string[];
  totalDurationMs: number;
}): NoteInput[] {
  const notes: NoteInput[] = [];
  const durationSec = (data.totalDurationMs / 1000).toFixed(1);

  notes.push({
    phase: 'crawling',
    subject: 'crawl summary',
    observed: `Crawled ${data.pageCount} page${data.pageCount !== 1 ? 's' : ''} in ${durationSec}s.`,
    signal: 'expected',
  });

  if (data.pagesSkipped > 0) {
    notes.push({
      phase: 'crawling',
      subject: 'skipped pages',
      observed: `Skipped ${data.pagesSkipped} page${data.pagesSkipped !== 1 ? 's' : ''} — errors or blocked by robots.txt.`,
      signal: data.pagesSkipped > 3 ? 'notable' : 'expected',
    });
  }

  if (data.robotsTxtStatus === 'found') {
    notes.push({
      phase: 'crawling',
      subject: 'robots.txt',
      observed: 'robots.txt is present and readable. Respecting the rules.',
      signal: 'expected',
    });
  } else if (data.robotsTxtStatus === 'not_found') {
    notes.push({
      phase: 'crawling',
      subject: 'robots.txt',
      observed: 'No robots.txt found.',
      signal: 'notable',
      context: 'Not required, but recommended. Agents and crawlers look for it.',
    });
  }

  if (data.detectedStack.length > 0) {
    const stack = data.detectedStack.join(', ');
    notes.push({
      phase: 'crawling',
      subject: 'tech stack',
      observed: `I can see this is a ${stack} site. Adjusting what I look for.`,
      signal: 'expected',
    });
  }

  return notes;
}

export function commentOnExtraction(data: {
  summaryCount: number;
  imageCount?: number;
  missingAltCount?: number;
  structuredDataPages?: number;
}): NoteInput[] {
  const notes: NoteInput[] = [];

  notes.push({
    phase: 'extracting',
    subject: 'extraction',
    observed: `Extracted structured summaries from ${data.summaryCount} page${data.summaryCount !== 1 ? 's' : ''}.`,
    signal: 'expected',
  });

  if (data.missingAltCount && data.missingAltCount > 0) {
    notes.push({
      phase: 'extracting',
      subject: 'images',
      observed: `${data.missingAltCount} image${data.missingAltCount !== 1 ? 's' : ''} missing alt text.`,
      signal: 'notable',
      context: 'Screen readers and search engines rely on alt text.',
    });
  }

  if (data.structuredDataPages !== undefined) {
    if (data.structuredDataPages === 0) {
      notes.push({
        phase: 'extracting',
        subject: 'structured data',
        observed: 'No structured data (JSON-LD, microdata) found on any page.',
        signal: 'notable',
        context: 'Search engines use structured data for rich results.',
      });
    }
  }

  return notes;
}

export function commentOnAuditStart(): NoteInput[] {
  return [{
    phase: 'auditing',
    subject: 'audit',
    observed: 'Six inspectors working simultaneously. Each checking a different dimension.',
    signal: 'expected',
  }];
}

export function commentOnAuditComplete(data: {
  totalFindings: number;
  dimensionsClean: number;
}): NoteInput[] {
  const notes: NoteInput[] = [];

  if (data.totalFindings === 0) {
    notes.push({
      phase: 'auditing',
      subject: 'audit results',
      observed: 'All dimensions came back clean. That is uncommon.',
      signal: 'surprising',
    });
  } else {
    notes.push({
      phase: 'auditing',
      subject: 'audit results',
      observed: `${data.totalFindings} finding${data.totalFindings !== 1 ? 's' : ''} across all dimensions. ${data.dimensionsClean} dimension${data.dimensionsClean !== 1 ? 's' : ''} came back clean.`,
      signal: 'expected',
    });
  }

  return notes;
}

export function commentOnSynthesis(data: {
  duplicatesRemoved: number;
  uniqueFindings: number;
  causalChains: number;
}): NoteInput[] {
  const notes: NoteInput[] = [];

  notes.push({
    phase: 'synthesizing',
    subject: 'synthesis',
    observed: 'All checks complete. Connecting the dots — looking for patterns.',
    signal: 'expected',
  });

  if (data.duplicatesRemoved > 0) {
    notes.push({
      phase: 'synthesizing',
      subject: 'deduplication',
      observed: `Removed ${data.duplicatesRemoved} duplicate finding${data.duplicatesRemoved !== 1 ? 's' : ''}. ${data.uniqueFindings} unique remain.`,
      signal: 'expected',
    });
  }

  if (data.causalChains > 0) {
    notes.push({
      phase: 'synthesizing',
      subject: 'causal chains',
      observed: `Found ${data.causalChains} causal chain${data.causalChains !== 1 ? 's' : ''} — some findings share a root cause.`,
      signal: 'notable',
    });
  }

  return notes;
}

export function commentOnComplete(findingCount: number): NoteInput[] {
  return [{
    phase: 'rendering',
    subject: 'report',
    observed: `Inspection complete. ${findingCount} finding${findingCount !== 1 ? 's' : ''} documented. Opening the report now.`,
    signal: 'expected',
  }];
}

function extractPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname === '/' ? '/' : parsed.pathname;
  } catch {
    return url;
  }
}
