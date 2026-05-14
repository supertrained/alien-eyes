import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { findSimilarCompanies, findCompetitors, type CompetitorResult } from "@marketing/exa";
import {
  bulkTrafficEstimation,
  getKeywordIntersection,
  technologyDetection,
  type KeywordIntersectionResult,
} from "@marketing/dataforseo";
import { runPageSpeedInsight, type PageSpeedResult } from "@marketing/pagespeed";
import { complete, getModelName } from "@marketing/models";
import { checkEmailAuthentication, type EmailAuthResult } from "@marketing/email-auth";

export interface CompetitorProfile {
  domain: string;
  name: string;
  snippet: string;
  similarityScore: number;
  traffic: {
    organic: number | null;
    paid: number | null;
  };
  pagespeed: {
    mobileScore: number | null;
    desktopScore: number | null;
  };
  techStack: string[];
  emailAuth: {
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
    dmarcPolicy: string | null;
  } | null;
}

export interface CompetitorContextData {
  competitors: CompetitorProfile[];
  comparison: {
    trafficGap: string | null;
    speedComparison: string | null;
    overallPosition: string | null;
  };
  keywordGap: KeywordIntersectionResult | null;
  competitorAds: Array<{
    domain: string;
    metaAdCount: number | null;
  }> | null;
  signals: string[];
}

// Directory/review/aggregator sites that are not real competitors
const DIRECTORY_BLOCKLIST = [
  "clutch.co",
  "g2.com",
  "capterra.com",
  "trustpilot.com",
  "yelp.com",
  "bbb.org",
  "crunchbase.com",
  "linkedin.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "youtube.com",
  "reddit.com",
  "quora.com",
  "medium.com",
  "wikipedia.org",
  "glassdoor.com",
  "indeed.com",
  "softwareadvice.com",
  "getapp.com",
  "sourceforge.net",
  "alternativeto.net",
  "producthunt.com",
  "techcrunch.com",
  "forbes.com",
  "bloomberg.com",
];

/**
 * Best-effort Meta Ad Library ad count for a list of domains.
 * Uses HTTP fetch (NOT Playwright) to hit the Meta Ad Library search page
 * and extract the ad count from the response HTML. Returns null on failure.
 */
async function fetchMetaAdCount(domain: string): Promise<number | null> {
  try {
    const searchUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(domain)}&search_type=keyword_unordered`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const html = await response.text();
    // Meta Ad Library shows count in various patterns — try common ones
    const patterns = [
      /(\d[\d,]+)\s+results?/i,
      /showing\s+(\d[\d,]+)/i,
      /About\s+(\d[\d,]+)\s+ads?/i,
      /"total_count"\s*:\s*(\d+)/,
      /totalCount['"]\s*:\s*(\d+)/,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return parseInt(match[1].replace(/,/g, ""), 10);
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchCompetitorMetaAdCounts(
  domains: string[]
): Promise<Array<{ domain: string; metaAdCount: number | null }>> {
  try {
    const results = await Promise.all(
      domains.map(async (domain) => ({
        domain,
        metaAdCount: await fetchMetaAdCount(domain),
      }))
    );
    return results;
  } catch {
    return [];
  }
}

const MIN_SIMILARITY_SCORE = 0.15;

export interface CompetitorSearchContext {
  industry?: string;
  subIndustry?: string;
  description?: string;
  keywords?: string[];
}

/** LLM validation: reject candidates that are adjacent/unrelated, not direct competitors */
async function validateCompetitors(
  targetDomain: string,
  targetDescription: string | undefined,
  targetIndustry: string | undefined,
  candidates: CompetitorResult[]
): Promise<CompetitorResult[]> {
  if (candidates.length === 0) return [];

  try {
    const result = await complete("haiku", [
      {
        role: "user",
        content: `Validate whether these companies are actual DIRECT competitors of ${targetDomain}.

Target company: ${targetDomain}
Industry: ${targetIndustry ?? "unknown"}
Description: ${targetDescription ?? "unknown"}

Candidates:
${candidates.map((c, i) => `${i + 1}. ${c.title} (${c.domain}) — "${c.snippet}"`).join("\n")}

For each candidate, determine:
- DIRECT competitor: same market, same customer, substitutable product → true
- ADJACENT: related industry but different product/market → false
- UNRELATED: different market entirely → false

IMPORTANT: Market intelligence platforms, workflow engines, generic SaaS tools, and developer infrastructure that serves a different use case are NOT competitors.

Respond in JSON only:
{"validations": [{"domain": "...", "isCompetitor": true/false, "reason": "one sentence"}]}`,
      },
    ], { temperature: 0, maxTokens: 1024 });

    const parsed = JSON.parse(
      result.content.match(/\{[\s\S]*\}/)?.[0] ?? "{}"
    );
    const validations = parsed.validations ?? [];

    return candidates.filter((c) => {
      const v = validations.find((val: { domain: string; isCompetitor: boolean }) => val.domain === c.domain);
      return v?.isCompetitor === true;
    });
  } catch {
    // CRITICAL: On parsing failure, REJECT all candidates (not accept).
    // False negative is harmless; false positive (wrong competitor) destroys trust.
    return [];
  }
}

export async function runCompetitorContext(
  domain: string,
  context?: CompetitorSearchContext,
  targetTraffic?: number | null
): Promise<Envelope<CompetitorContextData | null>> {
  const startTime = Date.now();
  const primitive = "competitor_context";

  try {
    // Strategy 1: Neural URL similarity (most accurate)
    let exaResults: CompetitorResult[] = [];
    try {
      exaResults = await findSimilarCompanies(domain);
      if (exaResults.length === 0) {
        console.warn(`[competitor-context] findSimilar returned 0 results for ${domain}`);
      }
    } catch (err) {
      console.error(`[competitor-context] findSimilar failed for ${domain}:`, (err as Error).message);
      // Fallback: enriched text query
      try {
        exaResults = await findCompetitors(domain, context);
      } catch (err2) {
        console.error(`[competitor-context] findCompetitors also failed for ${domain}:`, (err2 as Error).message);
      }
    }

    // If findSimilar returned low-quality results, try text query too
    if (exaResults.length === 0 || exaResults.every((r) => r.score < MIN_SIMILARITY_SCORE)) {
      try {
        const textResults = await findCompetitors(domain, context);
        // Merge, preferring higher scores
        const allDomains = new Set(exaResults.map((r) => r.domain));
        for (const r of textResults) {
          if (!allDomains.has(r.domain)) {
            exaResults.push(r);
            allDomains.add(r.domain);
          }
        }
      } catch {
        // If both strategies fail, continue with whatever we have
      }
    }

    // Deduplicate, filter directory sites, apply score threshold, take top 5 for validation
    const seen = new Set<string>();
    const candidates = exaResults
      .filter((r) => {
        if (seen.has(r.domain)) return false;
        if (r.domain === domain) return false;
        if (DIRECTORY_BLOCKLIST.some((blocked) => r.domain.endsWith(blocked))) return false;
        if (r.score < MIN_SIMILARITY_SCORE) return false;
        seen.add(r.domain);
        return true;
      })
      .slice(0, 5);

    // LLM validation gate — reject non-competitors
    const validated = await validateCompetitors(
      domain,
      context?.description,
      context?.industry,
      candidates
    );

    // Use validated competitors (max 3)
    const topCompetitors = validated.slice(0, 3);

    // If no validated competitors, return honest assessment
    if (topCompetitors.length === 0) {
      return createEnvelope<CompetitorContextData>(primitive, startTime, {
        competitors: [],
        comparison: { trafficGap: null, speedComparison: null, overallPosition: null },
        keywordGap: null,
        competitorAds: null,
        signals: [
          "Could not identify confident direct competitors — this may indicate a niche market, a new category, or that competitors use different terminology",
          candidates.length > 0
            ? `${candidates.length} adjacent companies were found but did not pass competitor validation`
            : "No candidate companies were found via web search",
        ],
      }, {
        confidence: 0.3,
        confidenceFactors: [
          "No validated competitors found",
          candidates.length > 0
            ? `${candidates.length} candidates rejected by LLM validation`
            : "Exa returned no relevant results",
        ],
      });
    }

    // Enrich top 2 competitors with traffic + pagespeed + tech stack + email auth in parallel
    const enriched = await Promise.all(
      topCompetitors.slice(0, 2).map(async (comp): Promise<CompetitorProfile> => {
        const [traffic, psiMobile, psiDesktop, techResult, emailAuthResult] = await Promise.all([
          bulkTrafficEstimation(comp.domain).catch(() => ({
            domain: comp.domain,
            organicTraffic: null,
            paidTraffic: null,
            organicCost: null,
            paidCost: null,
            organicKeywordsCount: null,
            topPages: [],
          })),
          runPageSpeedInsight(`https://${comp.domain}`, "mobile").catch(() => null),
          runPageSpeedInsight(`https://${comp.domain}`, "desktop").catch(() => null),
          technologyDetection(comp.domain).catch(() => ({ technologies: [] })),
          checkEmailAuthentication(comp.domain).catch(() => null),
        ]);

        return {
          domain: comp.domain,
          name: comp.title,
          snippet: comp.snippet,
          similarityScore: comp.score,
          traffic: {
            organic: traffic.organicTraffic,
            paid: traffic.paidTraffic,
          },
          pagespeed: {
            mobileScore: psiMobile?.performanceScore ?? null,
            desktopScore: psiDesktop?.performanceScore ?? null,
          },
          techStack: techResult.technologies.map((t) => t.name),
          emailAuth: emailAuthResult ? {
            spf: emailAuthResult.spf.found,
            dkim: emailAuthResult.dkim.found,
            dmarc: emailAuthResult.dmarc.found,
            dmarcPolicy: emailAuthResult.dmarc.policy,
          } : null,
        };
      })
    );

    // Add remaining competitors without enrichment
    const unenriched = topCompetitors.slice(2).map((comp): CompetitorProfile => ({
      domain: comp.domain,
      name: comp.title,
      snippet: comp.snippet,
      similarityScore: comp.score,
      traffic: { organic: null, paid: null },
      pagespeed: { mobileScore: null, desktopScore: null },
      techStack: [],
      emailAuth: null,
    }));

    const competitors = [...enriched, ...unenriched];

    // Build comparison with Haiku
    let comparison: CompetitorContextData["comparison"] = {
      trafficGap: null,
      speedComparison: null,
      overallPosition: null,
    };

    if (enriched.length > 0) {
      const compData = enriched.map((c) => ({
        domain: c.domain,
        organicTraffic: c.traffic.organic,
        paidTraffic: c.traffic.paid,
        mobileSpeed: c.pagespeed.mobileScore,
      }));

      const result = await complete("haiku", [
        {
          role: "user",
          content: `Compare ${domain} (organic traffic: ${targetTraffic ?? "unknown"}) against these competitors:

${JSON.stringify(compData, null, 2)}

Provide 1-sentence each for:
1. trafficGap: How does the target compare on traffic?
2. speedComparison: How do page speeds compare?
3. overallPosition: Where does the target stand competitively?

Respond in JSON: { "trafficGap": "...", "speedComparison": "...", "overallPosition": "..." }`,
        },
      ], { temperature: 0.2 });

      try {
        comparison = JSON.parse(result.content);
      } catch {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) comparison = JSON.parse(jsonMatch[0]);
      }
    }

    // Keyword gap analysis and competitor ads (run in parallel)
    const top2Domains = enriched.map((c) => c.domain);
    const [keywordGap, competitorAds] = await Promise.all([
      top2Domains.length > 0
        ? getKeywordIntersection(domain, top2Domains)
        : Promise.resolve(null),
      top2Domains.length > 0
        ? fetchCompetitorMetaAdCounts(top2Domains)
        : Promise.resolve(null),
    ]);

    // Build signals
    const signals: string[] = [];
    if (competitors.length === 0) {
      signals.push("Could not identify competitors via Exa web search — may indicate a very niche market or new category");
    } else {
      signals.push(`Identified ${competitors.length} competitor${competitors.length > 1 ? "s" : ""} via Exa (filtered ${DIRECTORY_BLOCKLIST.length} directory/aggregator sites)`);

      // Traffic comparison with source attribution
      for (const comp of enriched) {
        if (comp.traffic.organic !== null && targetTraffic !== null && targetTraffic !== undefined) {
          if (comp.traffic.organic > targetTraffic * 10) {
            signals.push(`${comp.domain} has ~${Math.round(comp.traffic.organic / targetTraffic)}x more organic traffic (per DataForSEO) — significant competitive gap`);
          } else if (comp.traffic.organic > targetTraffic * 3) {
            signals.push(`${comp.domain} has ~${Math.round(comp.traffic.organic / targetTraffic)}x more organic traffic (per DataForSEO)`);
          }
        }
      }
    }

    // Keyword gap signals
    if (keywordGap && keywordGap.gapKeywords.length > 0) {
      signals.push(
        `Competitors rank for ${keywordGap.totalGapCount} keywords you don't, including '${keywordGap.gapKeywords[0].keyword}' with ${keywordGap.gapKeywords[0].searchVolume} monthly searches`
      );
      const topGap = keywordGap.gapKeywords[0];
      signals.push(
        `Top keyword gap opportunity: '${topGap.keyword}' (${topGap.searchVolume} searches/mo) — competitor ranks #${topGap.competitorPosition}`
      );
    }

    // Tech stack comparison signals
    for (const comp of enriched) {
      if (comp.techStack.length > 0) {
        const marketingTools = comp.techStack.filter((t) =>
          /analytics|tag.manager|hotjar|clarity|hubspot|salesforce|mailchimp|klaviyo|intercom|drift|zendesk|segment|amplitude|mixpanel/i.test(t)
        );
        if (marketingTools.length > 0) {
          signals.push(`${comp.domain} uses ${marketingTools.join(", ")} — evaluate whether you're missing key tools`);
        }
      }
    }

    // Email auth comparison signals
    for (const comp of enriched) {
      if (comp.emailAuth) {
        if (comp.emailAuth.dmarcPolicy === "reject" || comp.emailAuth.dmarcPolicy === "quarantine") {
          signals.push(`${comp.domain} has DMARC ${comp.emailAuth.dmarcPolicy} policy — stronger email deliverability protection`);
        }
        if (comp.emailAuth.dkim && comp.emailAuth.spf && comp.emailAuth.dmarc) {
          signals.push(`${comp.domain} has full email authentication (SPF + DKIM + DMARC) — check if yours matches`);
        }
      }
    }

    // Competitor ad signals
    if (competitorAds) {
      for (const ca of competitorAds) {
        if (ca.metaAdCount !== null && ca.metaAdCount > 0) {
          signals.push(
            `Your top competitor (${ca.domain}) has ${ca.metaAdCount} active Meta ads. You have zero.`
          );
        }
      }
    }

    // Confidence: boost if keyword gap data is available
    let confidence = competitors.length > 0 ? 0.7 : 0.3;
    if (keywordGap && keywordGap.gapKeywords.length > 0) {
      confidence = Math.min(confidence + 0.05, 0.95);
    }

    return createEnvelope<CompetitorContextData>(primitive, startTime, {
      competitors,
      comparison,
      keywordGap,
      competitorAds,
      signals,
    }, {
      confidence,
      confidenceFactors: [
        `${competitors.length} competitors found via Exa`,
        `${enriched.length} competitors enriched with traffic/speed data`,
        keywordGap ? `${keywordGap.gapKeywords.length} keyword gap opportunities found` : "No keyword gap data",
        competitorAds ? `Meta ad counts checked for ${competitorAds.length} competitors` : "No competitor ad data",
      ],
      model: enriched.length > 0 ? getModelName("haiku") : undefined,
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
