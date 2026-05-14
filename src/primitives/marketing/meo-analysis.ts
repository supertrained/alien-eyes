import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { complete, getModelName } from "@marketing/models";
import { searchWeb } from "@marketing/exa";
import { checkAiDiscoverability } from "@marketing/ai-discoverability";
import { absenceSignal } from "@marketing/signal-builder";

export interface MeoAnalysisData {
  semanticDensityScore: number;
  entityConsistencyScore: number;
  queryProximityScore: number;
  overallMeoScore: number;
  findings: {
    quotableStatements: number;
    vagueStatements: number;
    entityVariations: string[];
    answerFirstPages: number;
    structuredDataPresent: boolean;
    authorAttribution: boolean;
    jsonLd: boolean;
    openGraph: boolean;
    metaDescription: boolean;
    llmsTxt: boolean;
    aiTxt: boolean;
  };
  exaResults: {
    totalResults: number;
    snippetConsistency: string;
    topSnippets: string[];
  };
  signals: string[];
  recommendations: string[];
}

/**
 * Extract JSON-LD blocks from HTML source.
 */
function extractJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      // malformed JSON-LD — skip
    }
  }
  return blocks;
}

/**
 * Check for Open Graph tags in HTML.
 */
function hasOpenGraph(html: string): boolean {
  return /property=["']og:(title|description|image|url)["']/i.test(html);
}

/**
 * Check for meta description tag.
 */
function hasMetaDescription(html: string): boolean {
  return /<meta[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i.test(html);
}

/**
 * Check for author attribution patterns in HTML.
 */
function hasAuthorAttribution(html: string): boolean {
  const patterns = [
    /<meta[^>]*name=["']author["'][^>]*>/i,
    /rel=["']author["']/i,
    /class=["'][^"']*author[^"']*["']/i,
    /itemprop=["']author["']/i,
    /"author"\s*:\s*\{/i,
    /"author"\s*:\s*"/i,
  ];
  return patterns.some((p) => p.test(html));
}

/**
 * Assess snippet consistency across Exa results.
 * Compares how similarly the brand is described across different sources.
 */
function assessSnippetConsistency(
  snippets: string[],
  domain: string
): "high" | "medium" | "low" {
  if (snippets.length < 2) return "low";

  // Extract brand-related phrases from each snippet
  const domainRoot = domain.replace(/\.(com|io|co|org|net|ai)$/i, "").replace(/[-_]/g, " ");
  const brandMentions = snippets.filter((s) =>
    s.toLowerCase().includes(domainRoot.toLowerCase())
  );

  const mentionRatio = brandMentions.length / snippets.length;
  if (mentionRatio >= 0.8) return "high";
  if (mentionRatio >= 0.4) return "medium";
  return "low";
}

export async function runMeoAnalysis(
  url: string,
  domain: string
): Promise<Envelope<MeoAnalysisData | null>> {
  const startTime = Date.now();
  const primitive = "meo_analysis";

  try {
    const signals: string[] = [];
    const recommendations: string[] = [];
    const confidenceFactors: string[] = [];
    let confidence = 0.5;

    // --- Step 1: Exa search for brand presence in semantic search ---
    let exaResults: MeoAnalysisData["exaResults"] = {
      totalResults: 0,
      snippetConsistency: "low",
      topSnippets: [],
    };

    try {
      const webResults = await searchWeb(`${domain} company`);
      if (webResults.length > 0) {
        confidence += 0.15;
        confidenceFactors.push(`Exa returned ${webResults.length} results for brand search`);

        const snippets = webResults
          .map((r) => r.snippet)
          .filter((s) => s.length > 0);

        exaResults = {
          totalResults: webResults.length,
          snippetConsistency: assessSnippetConsistency(snippets, domain),
          topSnippets: snippets.slice(0, 5),
        };

        if (exaResults.snippetConsistency === "high") {
          signals.push(
            `Strong brand consistency in AI search: ${webResults.length} Exa results describe the brand consistently`
          );
        } else if (exaResults.snippetConsistency === "medium") {
          signals.push(
            `Moderate brand consistency in AI search: descriptions vary across ${webResults.length} Exa results`
          );
          recommendations.push(
            "Standardize how the brand is described across web properties — AI systems retrieve more consistent brands more reliably"
          );
        } else {
          signals.push(
            `Weak brand presence in AI search: only ${webResults.length} Exa results found, with inconsistent descriptions`
          );
          recommendations.push(
            "Publish consistent brand descriptions across the web — press mentions, directories, and social profiles should all use the same positioning statement"
          );
        }
      } else {
        confidenceFactors.push("No Exa results for brand search");
        signals.push(
          "No results found in AI semantic search for this brand — the brand may not yet exist in AI training data or retrieval indexes"
        );
        recommendations.push(
          "Build web presence on high-authority sites (industry directories, press, guest posts) to appear in AI retrieval results"
        );
      }
    } catch (e) {
      confidenceFactors.push(`Exa search failed: ${(e as Error).message}`);
    }

    // --- Step 2: Fetch homepage HTML ---
    let html = "";
    let htmlFetched = false;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) {
        html = await response.text();
        htmlFetched = true;
        confidenceFactors.push("Homepage HTML fetched successfully");
      } else {
        confidenceFactors.push(`Homepage fetch returned ${response.status}`);
      }
    } catch (e) {
      confidenceFactors.push(`Homepage fetch failed: ${(e as Error).message}`);
    }

    // --- Step 3: Extract structured data from HTML ---
    const jsonLdBlocks = htmlFetched ? extractJsonLd(html) : [];
    const ogPresent = htmlFetched ? hasOpenGraph(html) : false;
    const metaDescPresent = htmlFetched ? hasMetaDescription(html) : false;
    const authorPresent = htmlFetched ? hasAuthorAttribution(html) : false;
    const structuredDataPresent =
      jsonLdBlocks.length > 0 || ogPresent || metaDescPresent;

    if (structuredDataPresent) {
      confidence += 0.15;
      confidenceFactors.push("Structured data found in HTML");
    } else if (htmlFetched) {
      confidenceFactors.push("No structured data found in HTML");
    }

    if (jsonLdBlocks.length > 0) {
      signals.push(
        `JSON-LD structured data detected: ${jsonLdBlocks.length} block(s) — helps AI systems understand entity relationships`
      );
    } else if (htmlFetched) {
      signals.push(
        `${absenceSignal("JSON-LD structured data", { checked: ["homepage HTML"], method: "HTML pattern match", coverage: "homepage_only" })} — AI systems rely on structured data to understand what a business does and how entities relate`
      );
      recommendations.push(
        "Add JSON-LD structured data (Organization, WebSite, and relevant product/service schemas) to help AI systems parse your business identity"
      );
    }

    if (ogPresent) {
      signals.push("Open Graph tags detected — content will render correctly when shared or cited by AI");
    } else if (htmlFetched) {
      recommendations.push(
        "Add Open Graph tags (og:title, og:description, og:image) — these are used by AI systems and social platforms for content previews"
      );
    }

    if (!metaDescPresent && htmlFetched) {
      signals.push(
        `${absenceSignal("a meta description", { checked: ["homepage HTML"], method: "HTML pattern match", coverage: "homepage_only" })} — AI systems often use meta descriptions as the primary content summary`
      );
      recommendations.push(
        "Add a specific, claim-rich meta description (under 160 characters) — this is frequently the text AI systems cite"
      );
    }

    if (authorPresent) {
      signals.push(
        "Author attribution detected — research suggests author-attributed content receives significantly more AI citations"
      );
    } else if (htmlFetched) {
      signals.push(
        `${absenceSignal("author attribution", { checked: ["homepage HTML"], method: "HTML pattern match", coverage: "homepage_only" })} — research suggests unattributed content receives significantly fewer AI citations`
      );
      recommendations.push(
        "Add author attribution (schema.org Person markup + visible bylines) to increase AI citation likelihood"
      );
    }

    // --- Step 4: LLM analysis of semantic density, entity consistency, query proximity ---
    let semanticDensityScore = 0;
    let entityConsistencyScore = 0;
    let queryProximityScore = 0;
    let quotableStatements = 0;
    let vagueStatements = 0;
    let entityVariations: string[] = [];
    let answerFirstPages = 0;
    let llmModel: string | undefined;
    let llmTokens: number | undefined;
    let llmCost: number | undefined;

    if (htmlFetched && html.length > 200) {
      try {
        // Truncate HTML for LLM context — strip scripts/styles, keep body text
        const cleanedHtml = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 8000);

        const llmResult = await complete(
          "haiku",
          [
            {
              role: "user",
              content: `Analyze this website's homepage text for MEO (Meaning Engine Optimization) — how well this content would perform in AI retrieval systems.

HOMEPAGE TEXT:
${cleanedHtml}

BRAND DOMAIN: ${domain}

Analyze three dimensions and respond in JSON only:

{
  "semanticDensity": {
    "score": <0-100>,
    "quotableStatements": <count of specific, factual, citable claims (numbers, percentages, named outcomes)>,
    "vagueStatements": <count of generic filler phrases ("innovative solution", "world-class", "cutting-edge")>
  },
  "entityConsistency": {
    "score": <0-100>,
    "variations": <array of different ways the brand/company describes itself across the page — e.g. ["AI platform", "automation tool", "workflow engine"]>
  },
  "queryProximity": {
    "score": <0-100>,
    "answerFirstSections": <count of page sections that lead with an answer to a question rather than just stating features>
  }
}

Scoring guide:
- semanticDensity: 80+ = rich in specific claims, 50-79 = mixed, <50 = mostly vague
- entityConsistency: 80+ = consistent self-description, 50-79 = some variation, <50 = confusing/contradictory
- queryProximity: 80+ = content answers questions directly, 50-79 = mixed, <50 = feature-listing only

Respond with ONLY the JSON object.`,
            },
          ],
          { temperature: 0.1, maxTokens: 1024 }
        );

        llmModel = getModelName("haiku");
        llmTokens =
          llmResult.usage.inputTokens + llmResult.usage.outputTokens;
        llmCost = llmResult.usage.cost;

        // Parse LLM response
        let parsed: {
          semanticDensity?: { score?: number; quotableStatements?: number; vagueStatements?: number };
          entityConsistency?: { score?: number; variations?: string[] };
          queryProximity?: { score?: number; answerFirstSections?: number };
        } = {};

        try {
          parsed = JSON.parse(llmResult.content);
        } catch {
          const jsonMatch = llmResult.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        }

        semanticDensityScore = parsed.semanticDensity?.score ?? 0;
        entityConsistencyScore = parsed.entityConsistency?.score ?? 0;
        queryProximityScore = parsed.queryProximity?.score ?? 0;
        quotableStatements = parsed.semanticDensity?.quotableStatements ?? 0;
        vagueStatements = parsed.semanticDensity?.vagueStatements ?? 0;
        entityVariations = parsed.entityConsistency?.variations ?? [];
        answerFirstPages = parsed.queryProximity?.answerFirstSections ?? 0;

        confidence += 0.1;
        confidenceFactors.push("LLM semantic analysis completed");

        // Generate signals from LLM analysis
        if (semanticDensityScore >= 70) {
          signals.push(
            `Strong semantic density: ${quotableStatements} quotable claims found across homepage content`
          );
        } else if (semanticDensityScore >= 40) {
          signals.push(
            `Moderate semantic density: ${quotableStatements} quotable claims but ${vagueStatements} vague statements dilute citability`
          );
          recommendations.push(
            "Replace vague marketing language with specific claims — AI systems prefer content with numbers, named outcomes, and verifiable facts"
          );
        } else {
          signals.push(
            `Low semantic density: ${vagueStatements} vague statements vs only ${quotableStatements} quotable claims — AI systems will struggle to cite this content`
          );
          recommendations.push(
            "Rewrite homepage copy to lead with specific, verifiable claims (metrics, case study results, named capabilities) — vague language gets deprioritized in AI retrieval"
          );
        }

        if (entityVariations.length > 3) {
          signals.push(
            `Entity inconsistency detected: brand describes itself ${entityVariations.length} different ways (${entityVariations.slice(0, 3).join(", ")}${entityVariations.length > 3 ? "..." : ""}) — confuses AI entity resolution`
          );
          recommendations.push(
            `Pick one canonical brand description and use it consistently across the homepage — current variations: ${entityVariations.join(", ")}`
          );
        } else if (entityVariations.length > 0 && entityConsistencyScore >= 70) {
          signals.push(
            `Consistent entity description: brand maintains ${entityVariations.length} closely related description(s)`
          );
        }

        if (queryProximityScore < 50 && htmlFetched) {
          recommendations.push(
            "Restructure content to answer questions directly (\"What does X do?\" pattern) before listing features — AI systems favor answer-first content"
          );
        }
      } catch (e) {
        confidenceFactors.push(`LLM analysis failed: ${(e as Error).message}`);
      }
    }

    // --- Step 5: Check for AI discoverability files (shared utility) ---
    const baseUrl = url.replace(/\/+$/, "");
    const aiDiscovery = await checkAiDiscoverability(baseUrl);
    const llmsTxtFound = aiDiscovery.llmsTxt.found;
    const aiTxtFound = aiDiscovery.aiTxt.found;

    if (llmsTxtFound) {
      signals.push(
        "llms.txt file detected — actively providing structured context for AI systems"
      );
    }
    if (aiTxtFound) {
      signals.push(
        "ai.txt file detected — AI agent permissions and context explicitly declared"
      );
    }
    if (aiDiscovery.llmsFullTxt.found) {
      signals.push(
        "llms-full.txt file detected — extended LLM context available"
      );
    }
    if (aiDiscovery.aiPluginJson.found) {
      signals.push(
        ".well-known/ai-plugin.json detected — AI plugin manifest available"
      );
    }

    if (!llmsTxtFound && !aiTxtFound) {
      signals.push(
        absenceSignal("llms.txt or ai.txt", { checked: ["/llms.txt", "/ai.txt", "/.well-known/ai.txt"], method: "HTTP HEAD", coverage: "common_paths" }, "the site provides no explicit context for AI systems")
      );
      recommendations.push(
        "Create an llms.txt file (llmstxt.org spec) providing a structured summary of what your business does — AI systems check for this file"
      );
    }

    confidence += 0.1;
    confidenceFactors.push("AI discoverability check completed");

    // --- Compute overall MEO score ---
    // Weighted: semantic density 35%, entity consistency 25%, query proximity 25%, structural signals 15%
    const structuralScore =
      ((jsonLdBlocks.length > 0 ? 25 : 0) +
        (ogPresent ? 20 : 0) +
        (metaDescPresent ? 15 : 0) +
        (authorPresent ? 20 : 0) +
        (llmsTxtFound ? 10 : 0) +
        (aiTxtFound ? 10 : 0));

    const overallMeoScore = Math.round(
      semanticDensityScore * 0.35 +
        entityConsistencyScore * 0.25 +
        queryProximityScore * 0.25 +
        structuralScore * 0.15
    );

    // Overall score signal
    if (overallMeoScore >= 70) {
      signals.push(
        `Overall MEO score: ${overallMeoScore}/100 — this content is well-optimized for AI retrieval and citation`
      );
    } else if (overallMeoScore >= 40) {
      signals.push(
        `Overall MEO score: ${overallMeoScore}/100 — moderate readiness for AI retrieval, with room for improvement`
      );
    } else {
      signals.push(
        `Overall MEO score: ${overallMeoScore}/100 — this content is poorly positioned for AI retrieval and citation`
      );
    }

    return createEnvelope<MeoAnalysisData>(primitive, startTime, {
      semanticDensityScore,
      entityConsistencyScore,
      queryProximityScore,
      overallMeoScore,
      findings: {
        quotableStatements,
        vagueStatements,
        entityVariations,
        answerFirstPages,
        structuredDataPresent,
        authorAttribution: authorPresent,
        jsonLd: jsonLdBlocks.length > 0,
        openGraph: ogPresent,
        metaDescription: metaDescPresent,
        llmsTxt: llmsTxtFound,
        aiTxt: aiTxtFound,
      },
      exaResults,
      signals,
      recommendations,
    }, {
      confidence,
      confidenceFactors,
      model: llmModel,
      tokensUsed: llmTokens,
      costUsd: llmCost,
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
