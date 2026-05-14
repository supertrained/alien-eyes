import Exa from "exa-js";

let client: Exa | null = null;

function getClient(): Exa {
  if (!client) {
    const key = process.env.EXA_API_KEY;
    if (!key) throw new Error("EXA_API_KEY not set");
    client = new Exa(key);
  }
  return client;
}

export interface CompetitorResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  score: number;
}

/**
 * Primary strategy: neural URL similarity (finds companies with similar positioning).
 * Uses Exa's `findSimilarAndContents` which embeds the actual page content.
 */
export async function findSimilarCompanies(
  domain: string,
  excludeDomains?: string[]
): Promise<CompetitorResult[]> {
  const exa = getClient();
  const results = await exa.findSimilarAndContents(`https://${domain}`, {
    numResults: 10,
    excludeDomains: [domain, ...(excludeDomains ?? [])],
    category: "company",
    text: { maxCharacters: 300 },
  });

  return results.results.map((r) => ({
    title: r.title ?? "",
    url: r.url,
    domain: new URL(r.url).hostname.replace("www.", ""),
    snippet: r.text ?? "",
    score: r.score ?? 0,
  }));
}

/**
 * Fallback strategy: enriched text query using company context.
 * Uses subIndustry, description, and keywords for specificity.
 */
export async function findCompetitors(
  domain: string,
  context?: {
    industry?: string;
    subIndustry?: string;
    description?: string;
    keywords?: string[];
  }
): Promise<CompetitorResult[]> {
  const exa = getClient();

  // Build a specific query using all available context
  const parts: string[] = [];
  if (context?.subIndustry) {
    parts.push(context.subIndustry);
  } else if (context?.industry) {
    parts.push(context.industry);
  }
  if (context?.description) {
    const firstSentence = context.description.split(/\.\s/)[0];
    if (firstSentence.length < 120) parts.push(firstSentence);
  }
  if (context?.keywords && context.keywords.length > 0) {
    parts.push(context.keywords.slice(0, 3).join(", "));
  }

  const query = parts.length > 0
    ? `Companies that compete with ${domain}: ${parts.join(". ")}`
    : `Direct competitors of ${domain}`;

  const results = await exa.searchAndContents(query, {
    numResults: 10,
    type: "neural",
    category: "company",
    excludeDomains: [domain],
    text: { maxCharacters: 300 },
  });

  return results.results.map((r) => ({
    title: r.title ?? "",
    url: r.url,
    domain: new URL(r.url).hostname.replace("www.", ""),
    snippet: r.text ?? "",
    score: r.score ?? 0,
  }));
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export async function searchWeb(query: string): Promise<WebSearchResult[]> {
  const exa = getClient();
  const results = await exa.searchAndContents(query, {
    numResults: 5,
    type: "auto",
    text: { maxCharacters: 500 },
  });

  return results.results.map((r) => ({
    title: r.title ?? "",
    url: r.url,
    snippet: r.text ?? "",
    publishedDate: r.publishedDate ?? undefined,
  }));
}
