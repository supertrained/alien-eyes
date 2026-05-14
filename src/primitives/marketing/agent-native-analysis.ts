import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { searchWeb } from "@marketing/exa";
import { checkAiDiscoverability } from "@marketing/ai-discoverability";
import { absenceSignal } from "@marketing/signal-builder";

export type BusinessSegment = 'saas' | 'ecommerce' | 'local_business' | 'professional_services' | 'media' | 'other';

export interface AgentNativeAnalysisData {
  agentNativeScore: number;
  businessSegment: BusinessSegment;
  apiPresence: {
    hasApiPage: boolean;
    hasDocsPage: boolean;
    hasDeveloperPage: boolean;
  };
  structuredData: {
    jsonLdPresent: boolean;
    jsonLdTypes: string[];
    schemaOrgCoverage: number;
    openGraphComplete: boolean;
  };
  semanticHtml: {
    score: number;
    hasMain: boolean;
    hasNav: boolean;
    hasHeader: boolean;
    hasFooter: boolean;
    hasArticle: boolean;
    headingHierarchy: boolean;
    ariaAttributeCount: number;
  };
  aiDiscoverability: {
    llmsTxt: boolean;
    aiTxt: boolean;
    llmsFullTxt: boolean;
    aiPluginJson: boolean;
    robotsTxtAiDirectives: string[];
    appearsInAiSearch: boolean;
    snippetQuality: string;
  };
  integrationSignals: string[];
  signals: string[];
  recommendations: string[];
}

// AI bot user-agent directives to look for in robots.txt
const AI_BOT_NAMES = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "Anthropic",
  "Google-Extended",
  "Bard",
  "PerplexityBot",
  "Cohere-ai",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "FacebookBot",
  "Applebot-Extended",
];

// Integration platform patterns to look for in HTML
const INTEGRATION_PATTERNS: Array<{ name: string; patterns: RegExp[] }> = [
  { name: "Zapier", patterns: [/zapier\.com/i, /zapier/i] },
  { name: "Make (Integromat)", patterns: [/make\.com/i, /integromat/i] },
  { name: "n8n", patterns: [/n8n\.io/i, /n8n/i] },
  { name: "Webhooks", patterns: [/webhook/i] },
  { name: "OAuth", patterns: [/oauth/i, /\/authorize/i, /\/oauth2\//i] },
  { name: "REST API", patterns: [/\/api\/v\d/i, /rest\s*api/i, /api\s*endpoint/i] },
  { name: "GraphQL", patterns: [/graphql/i, /\/graphql/i] },
  { name: "Postman", patterns: [/postman/i, /getpostman\.com/i] },
  { name: "Swagger/OpenAPI", patterns: [/swagger/i, /openapi/i] },
  { name: "SDK", patterns: [/\bsdk\b/i, /npm\s+install/i, /pip\s+install/i] },
];

/**
 * Detect business segment from domain, HTML content, and tech stack signals.
 */
function detectSegment(domain: string, html: string, techStack: string[]): BusinessSegment {
  const lowerHtml = html.toLowerCase();
  const lowerDomain = domain.toLowerCase();

  // SaaS indicators
  if (techStack.some(t => /stripe|recurly|chargebee/i.test(t)) ||
      (lowerHtml.includes('pricing') && lowerHtml.includes('api')) ||
      lowerHtml.includes('/docs') || lowerHtml.includes('developer')) {
    return 'saas';
  }

  // E-commerce indicators
  if (techStack.some(t => /shopify|woocommerce|magento|bigcommerce/i.test(t)) ||
      lowerHtml.includes('add to cart') || lowerHtml.includes('shop now')) {
    return 'ecommerce';
  }

  // Local business indicators
  if (lowerHtml.includes('google.com/maps') || lowerHtml.includes('directions') ||
      lowerHtml.includes('hours of operation') || lowerHtml.includes('visit us')) {
    return 'local_business';
  }

  // Media indicators
  if (lowerDomain.includes('news') || lowerDomain.includes('blog') ||
      lowerHtml.includes('subscribe to our newsletter') && lowerHtml.includes('article')) {
    return 'media';
  }

  // Professional services
  if (lowerHtml.includes('consultation') || lowerHtml.includes('our team') ||
      lowerHtml.includes('case studies') || lowerHtml.includes('testimonials')) {
    return 'professional_services';
  }

  return 'other';
}

/**
 * Scoring weight adjustments per business segment.
 * Default weights: API=25, StructuredData=20, SemanticHTML=20, AiDiscoverability=20, Integration=15
 */
interface ScoringWeights {
  apiMax: number;
  structuredDataBonus: number;
  localSeoBonus: number;
  scoreFloor: number;
}

function getSegmentWeights(segment: BusinessSegment): ScoringWeights {
  switch (segment) {
    case 'local_business':
      return { apiMax: 5, structuredDataBonus: 15, localSeoBonus: 5, scoreFloor: 25 };
    case 'professional_services':
      return { apiMax: 5, structuredDataBonus: 15, localSeoBonus: 0, scoreFloor: 20 };
    case 'ecommerce':
      return { apiMax: 5, structuredDataBonus: 15, localSeoBonus: 0, scoreFloor: 20 };
    case 'media':
      return { apiMax: 10, structuredDataBonus: 10, localSeoBonus: 0, scoreFloor: 15 };
    case 'saas':
      return { apiMax: 25, structuredDataBonus: 0, localSeoBonus: 0, scoreFloor: 0 };
    default:
      return { apiMax: 25, structuredDataBonus: 0, localSeoBonus: 0, scoreFloor: 0 };
  }
}

/**
 * Extract JSON-LD blocks and return their @type values.
 */
function extractJsonLdTypes(html: string): string[] {
  const types: string[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item?.["@type"]) {
            const t = item["@type"];
            if (Array.isArray(t)) types.push(...t);
            else types.push(t);
          }
        }
      } else if (data?.["@type"]) {
        const t = data["@type"];
        if (Array.isArray(t)) types.push(...t);
        else types.push(t);
      }
      // Also check @graph
      if (data?.["@graph"] && Array.isArray(data["@graph"])) {
        for (const item of data["@graph"]) {
          if (item?.["@type"]) {
            const t = item["@type"];
            if (Array.isArray(t)) types.push(...t);
            else types.push(t);
          }
        }
      }
    } catch {
      // malformed JSON-LD — skip
    }
  }
  return [...new Set(types)];
}

/**
 * Check Open Graph completeness (must have title, description, image, and url).
 */
function checkOpenGraphCompleteness(html: string): boolean {
  const required = ["og:title", "og:description", "og:image", "og:url"];
  return required.every((tag) =>
    new RegExp(`property=["']${tag}["'][^>]*content=["'][^"']+["']`, "i").test(html) ||
    new RegExp(`content=["'][^"']+["'][^>]*property=["']${tag}["']`, "i").test(html)
  );
}

/**
 * Analyze semantic HTML structure.
 */
function analyzeSemanticHtml(html: string): AgentNativeAnalysisData["semanticHtml"] {
  const hasMain = /<main[\s>]/i.test(html) || /role=["']main["']/i.test(html);
  const hasNav = /<nav[\s>]/i.test(html) || /role=["']navigation["']/i.test(html);
  const hasHeader = /<header[\s>]/i.test(html) || /role=["']banner["']/i.test(html);
  const hasFooter = /<footer[\s>]/i.test(html) || /role=["']contentinfo["']/i.test(html);
  const hasArticle = /<article[\s>]/i.test(html);

  // Check heading hierarchy — h1 should exist and precede h2, h2 before h3, etc.
  const h1Match = html.match(/<h1[\s>]/gi);
  const h2Match = html.match(/<h2[\s>]/gi);
  const h3Match = html.match(/<h3[\s>]/gi);
  const hasH1 = (h1Match?.length ?? 0) > 0;
  const hasH2 = (h2Match?.length ?? 0) > 0;
  const hasH3 = (h3Match?.length ?? 0) > 0;

  // Hierarchy is proper if h1 exists, and if h3 exists then h2 also exists
  const headingHierarchy = hasH1 && (!hasH3 || hasH2);

  // Count ARIA attributes
  const ariaMatches = html.match(/aria-[a-z]+=["'][^"']*["']/gi);
  const ariaAttributeCount = ariaMatches?.length ?? 0;

  // Score computation
  let score = 0;
  if (hasMain) score += 15;
  if (hasNav) score += 15;
  if (hasHeader) score += 10;
  if (hasFooter) score += 10;
  if (hasArticle) score += 10;
  if (headingHierarchy) score += 20;
  // ARIA score — diminishing returns
  if (ariaAttributeCount >= 1) score += 5;
  if (ariaAttributeCount >= 5) score += 5;
  if (ariaAttributeCount >= 15) score += 5;
  if (ariaAttributeCount >= 30) score += 5;

  return {
    score,
    hasMain,
    hasNav,
    hasHeader,
    hasFooter,
    hasArticle,
    headingHierarchy,
    ariaAttributeCount,
  };
}

/**
 * Parse robots.txt for AI-specific directives.
 */
function parseRobotsTxtAiDirectives(robotsTxt: string): string[] {
  const directives: string[] = [];
  const lines = robotsTxt.split("\n");
  let currentAgent = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed.length === 0) continue;

    const agentMatch = trimmed.match(/^User-agent:\s*(.+)/i);
    if (agentMatch) {
      currentAgent = agentMatch[1].trim();
      continue;
    }

    const isAiBot = AI_BOT_NAMES.some(
      (bot) => currentAgent.toLowerCase() === bot.toLowerCase()
    );
    if (!isAiBot) continue;

    const allowMatch = trimmed.match(/^Allow:\s*(.+)/i);
    const disallowMatch = trimmed.match(/^Disallow:\s*(.+)/i);

    if (allowMatch) {
      directives.push(`${currentAgent}: Allow ${allowMatch[1].trim()}`);
    } else if (disallowMatch) {
      directives.push(`${currentAgent}: Disallow ${disallowMatch[1].trim()}`);
    }
  }

  return directives;
}

/**
 * Check if a URL returns a non-404 page (basic existence check).
 */
async function pageExists(checkUrl: string): Promise<boolean> {
  try {
    const response = await fetch(checkUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    // Accept 200-299 range; some API pages return 401/403 which still means they exist
    return response.status < 404;
  } catch {
    return false;
  }
}

export async function runAgentNativeAnalysis(
  url: string,
  domain: string
): Promise<Envelope<AgentNativeAnalysisData | null>> {
  const startTime = Date.now();
  const primitive = "agent_native_analysis";

  try {
    const signals: string[] = [];
    const recommendations: string[] = [];
    const confidenceFactors: string[] = [];
    let confidence = 0.5;

    const baseUrl = url.replace(/\/+$/, "");

    // --- Step 1: Fetch homepage HTML ---
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
        confidence += 0.15;
        confidenceFactors.push("Homepage HTML fetched successfully");
      } else {
        confidenceFactors.push(`Homepage fetch returned ${response.status}`);
      }
    } catch (e) {
      confidenceFactors.push(`Homepage fetch failed: ${(e as Error).message}`);
    }

    // --- Step 1b: Detect business segment ---
    // Extract tech stack signals from HTML for segment detection
    const detectedTechStack: string[] = [];
    if (htmlFetched) {
      if (/shopify/i.test(html)) detectedTechStack.push("Shopify");
      if (/woocommerce/i.test(html)) detectedTechStack.push("WooCommerce");
      if (/magento/i.test(html)) detectedTechStack.push("Magento");
      if (/bigcommerce/i.test(html)) detectedTechStack.push("BigCommerce");
      if (/stripe/i.test(html)) detectedTechStack.push("Stripe");
      if (/recurly/i.test(html)) detectedTechStack.push("Recurly");
      if (/chargebee/i.test(html)) detectedTechStack.push("Chargebee");
    }
    const businessSegment = detectSegment(domain, html, detectedTechStack);
    const weights = getSegmentWeights(businessSegment);
    signals.push(`Business segment detected: ${businessSegment} — scoring adjusted accordingly`);

    // --- Step 2: Check for API/developer pages ---
    const [hasApiPage, hasDocsPage, hasDeveloperPage] = await Promise.all([
      pageExists(`${baseUrl}/api`),
      pageExists(`${baseUrl}/docs`),
      pageExists(`${baseUrl}/developers`),
    ]);

    const apiPresence = { hasApiPage, hasDocsPage, hasDeveloperPage };
    const hasAnyApiPresence = hasApiPage || hasDocsPage || hasDeveloperPage;

    if (hasAnyApiPresence) {
      const pages = [
        hasApiPage && "/api",
        hasDocsPage && "/docs",
        hasDeveloperPage && "/developers",
      ].filter(Boolean);
      signals.push(
        `Developer-facing pages detected: ${pages.join(", ")} — indicates programmatic access is available`
      );
    } else {
      signals.push(
        "No API, docs, or developer pages detected at standard paths (/api, /docs, /developers)"
      );
      recommendations.push(
        "Consider publishing an API or developer documentation page — agents need programmatic access points to interact with your service"
      );
    }

    // --- Step 3: Check AI discoverability files + robots.txt ---
    const aiDiscovery = await checkAiDiscoverability(baseUrl);
    const llmsTxtFound = aiDiscovery.llmsTxt.found;
    const aiTxtFound = aiDiscovery.aiTxt.found;
    const llmsFullTxtFound = aiDiscovery.llmsFullTxt.found;
    const aiPluginJsonFound = aiDiscovery.aiPluginJson.found;
    let robotsTxtAiDirectives: string[] = [];

    if (llmsTxtFound) {
      signals.push(
        "llms.txt file detected — actively providing structured context for AI/LLM systems"
      );
    }
    if (aiTxtFound) {
      signals.push(
        "ai.txt file detected — AI agent permissions and instructions explicitly declared"
      );
    }
    if (llmsFullTxtFound) {
      signals.push(
        "llms-full.txt file detected — extended LLM context available beyond the standard llms.txt"
      );
    }
    if (aiPluginJsonFound) {
      signals.push(
        ".well-known/ai-plugin.json detected — AI plugin manifest available for agent integration"
      );
    }

    // Fetch robots.txt separately (not part of shared utility — different parsing logic)
    const robotsTxtResult = await fetch(`${baseUrl}/robots.txt`, {
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    }).catch(() => null);

    if (robotsTxtResult?.ok) {
      const robotsTxt = await robotsTxtResult.text().catch(() => "");
      if (robotsTxt.length > 0 && !/<html/i.test(robotsTxt)) {
        robotsTxtAiDirectives = parseRobotsTxtAiDirectives(robotsTxt);
        confidence += 0.1;
        confidenceFactors.push("robots.txt fetched and parsed");

        if (robotsTxtAiDirectives.length > 0) {
          const allowCount = robotsTxtAiDirectives.filter((d) =>
            d.includes("Allow")
          ).length;
          const disallowCount = robotsTxtAiDirectives.filter((d) =>
            d.includes("Disallow")
          ).length;

          if (disallowCount > 0 && allowCount === 0) {
            signals.push(
              `AI bot access restricted in robots.txt: ${disallowCount} Disallow directive(s) for AI crawlers (${robotsTxtAiDirectives.map((d) => d.split(":")[0]).join(", ")})`
            );
          } else if (allowCount > 0) {
            signals.push(
              `AI bot access explicitly allowed in robots.txt: ${allowCount} Allow directive(s) for AI crawlers`
            );
          }
        } else {
          signals.push(
            "robots.txt found but contains no AI-specific directives (GPTBot, ClaudeBot, etc.) — AI crawlers will follow default rules"
          );
        }
      }
    } else {
      confidenceFactors.push("No robots.txt found or fetch failed");
      signals.push(
        "No robots.txt detected — AI crawlers have no explicit guidance on what to access"
      );
    }

    if (!llmsTxtFound && !aiTxtFound) {
      recommendations.push(
        "Create an llms.txt file (llmstxt.org spec) with a structured summary of your business and offerings — AI systems check for this file when building context"
      );
    }

    // --- Step 4: Analyze structured data from HTML ---
    let jsonLdTypes: string[] = [];
    let jsonLdPresent = false;
    let openGraphComplete = false;
    let schemaOrgCoverage = 0;

    if (htmlFetched) {
      jsonLdTypes = extractJsonLdTypes(html);
      jsonLdPresent = jsonLdTypes.length > 0;
      openGraphComplete = checkOpenGraphCompleteness(html);

      // Schema.org coverage: score based on how many useful types are present
      const HIGH_VALUE_TYPES = [
        "Organization",
        "WebSite",
        "Product",
        "Service",
        "LocalBusiness",
        "Article",
        "FAQPage",
        "HowTo",
        "BreadcrumbList",
        "SoftwareApplication",
      ];
      const matchedHighValue = HIGH_VALUE_TYPES.filter((t) =>
        jsonLdTypes.some((jt) => jt.toLowerCase() === t.toLowerCase())
      );
      schemaOrgCoverage = Math.min(
        Math.round((matchedHighValue.length / 4) * 100),
        100
      );

      if (jsonLdPresent) {
        signals.push(
          `JSON-LD structured data detected with ${jsonLdTypes.length} type(s): ${jsonLdTypes.join(", ")} — provides machine-readable entity context`
        );
        if (schemaOrgCoverage < 50) {
          recommendations.push(
            `Add more Schema.org types — currently only ${jsonLdTypes.join(", ")}. Consider adding Organization, Product/Service, FAQPage for richer AI understanding`
          );
        }
      } else {
        signals.push(
          `${absenceSignal("JSON-LD structured data", { checked: ["homepage HTML"], method: "HTML pattern match", coverage: "homepage_only" })} — agents and AI systems cannot parse machine-readable entity data from this site`
        );
        recommendations.push(
          "Add JSON-LD structured data (at minimum: Organization + WebSite schemas) to provide machine-readable context for AI agents"
        );
      }

      if (openGraphComplete) {
        signals.push(
          "Open Graph tags are complete (title, description, image, url) — content is properly described for sharing and AI citation"
        );
      } else {
        signals.push(
          "Open Graph tags are incomplete — missing one or more of: og:title, og:description, og:image, og:url"
        );
        recommendations.push(
          "Complete Open Graph tags (og:title, og:description, og:image, og:url) — AI systems use these for content summaries and citations"
        );
      }

      confidence += 0.15;
      confidenceFactors.push("Structured data analysis completed");
    }

    // --- Step 5: Analyze semantic HTML ---
    const semanticHtml = htmlFetched
      ? analyzeSemanticHtml(html)
      : {
          score: 0,
          hasMain: false,
          hasNav: false,
          hasHeader: false,
          hasFooter: false,
          hasArticle: false,
          headingHierarchy: false,
          ariaAttributeCount: 0,
        };

    if (htmlFetched) {
      if (semanticHtml.score >= 70) {
        signals.push(
          `Strong semantic HTML structure (score: ${semanticHtml.score}/100) with ${semanticHtml.ariaAttributeCount} ARIA attributes — well-structured for agent parsing`
        );
      } else if (semanticHtml.score >= 40) {
        signals.push(
          `Moderate semantic HTML structure (score: ${semanticHtml.score}/100) — some landmark elements present but incomplete`
        );
        const missing = [
          !semanticHtml.hasMain && "<main>",
          !semanticHtml.hasNav && "<nav>",
          !semanticHtml.hasHeader && "<header>",
          !semanticHtml.hasFooter && "<footer>",
          !semanticHtml.headingHierarchy && "proper heading hierarchy",
        ].filter(Boolean);
        if (missing.length > 0) {
          recommendations.push(
            `Add missing semantic HTML elements: ${missing.join(", ")} — agents use landmark roles to navigate and understand page structure`
          );
        }
      } else {
        signals.push(
          `Weak semantic HTML structure (score: ${semanticHtml.score}/100) — AI agents will have difficulty parsing page content reliably`
        );
        recommendations.push(
          "Restructure HTML with semantic landmarks (<main>, <nav>, <header>, <footer>, <article>) and proper heading hierarchy — this is foundational for agent accessibility"
        );
      }

      if (semanticHtml.ariaAttributeCount === 0) {
        recommendations.push(
          "Add ARIA attributes (aria-label, aria-describedby, role) to interactive elements — agents use these for understanding UI semantics"
        );
      }
    }

    // --- Step 6: Exa search for developer/API presence ---
    let appearsInAiSearch = false;
    let snippetQuality: string = "none";

    try {
      const [apiSearchResults, integrationResults] = await Promise.all([
        searchWeb(`"${domain}" API`).catch(() => []),
        searchWeb(`"${domain}" integration`).catch(() => []),
      ]);

      const allResults = [...apiSearchResults, ...integrationResults];
      appearsInAiSearch = allResults.length > 0;

      if (appearsInAiSearch) {
        confidence += 0.1;
        confidenceFactors.push(
          `Exa returned ${allResults.length} results for API/integration searches`
        );

        // Assess snippet quality based on relevance
        const relevantResults = allResults.filter(
          (r) =>
            r.snippet.toLowerCase().includes("api") ||
            r.snippet.toLowerCase().includes("integration") ||
            r.snippet.toLowerCase().includes("developer") ||
            r.snippet.toLowerCase().includes("webhook")
        );

        if (relevantResults.length >= 3) {
          snippetQuality = "strong";
          signals.push(
            `Strong developer ecosystem signal: ${relevantResults.length} relevant API/integration mentions found in AI search`
          );
        } else if (relevantResults.length >= 1) {
          snippetQuality = "moderate";
          signals.push(
            `Moderate developer presence: ${relevantResults.length} API/integration mention(s) found in AI search`
          );
        } else {
          snippetQuality = "weak";
          signals.push(
            "Brand appears in AI search but with no API/integration context — developer presence is not well-represented"
          );
        }
      } else {
        confidenceFactors.push("No Exa results for API/integration searches");
        signals.push(
          "No API or integration mentions found in AI search — the brand has no visible developer ecosystem"
        );
        recommendations.push(
          "Create content about your integrations and technical capabilities — publish API docs, integration guides, or developer blog posts to build developer discoverability"
        );
      }
    } catch (e) {
      confidenceFactors.push(`Exa search failed: ${(e as Error).message}`);
    }

    // --- Step 7: Check HTML for integration signals ---
    const integrationSignals: string[] = [];

    if (htmlFetched) {
      for (const integration of INTEGRATION_PATTERNS) {
        const found = integration.patterns.some((p) => p.test(html));
        if (found) {
          integrationSignals.push(integration.name);
        }
      }

      if (integrationSignals.length > 0) {
        signals.push(
          `Integration signals detected in HTML: ${integrationSignals.join(", ")} — indicates some level of programmable access`
        );
      }
    }

    // --- Compute overall agent-native score (segment-adjusted) ---
    let agentNativeScore = 0;

    // API presence — weight adjusted by segment (default 25, reduced for non-tech)
    const apiRawScore = (hasApiPage ? 10 : 0) + (hasDocsPage ? 10 : 0) + (hasDeveloperPage ? 5 : 0);
    agentNativeScore += Math.min(Math.round(apiRawScore * (weights.apiMax / 25)), weights.apiMax);

    // Structured data (20 points base + segment bonus for non-tech)
    const structuredDataMaxBase = 20 + weights.structuredDataBonus;
    let structuredDataScore = 0;
    if (jsonLdPresent) structuredDataScore += 10;
    if (openGraphComplete) structuredDataScore += 5;
    structuredDataScore += Math.round(schemaOrgCoverage * 0.05);
    // Scale structured data score to its adjusted max
    agentNativeScore += Math.min(Math.round(structuredDataScore * (structuredDataMaxBase / 20)), structuredDataMaxBase);

    // Local SEO bonus (for local businesses with Google Business / map signals)
    if (weights.localSeoBonus > 0 && htmlFetched) {
      const lowerHtmlLocal = html.toLowerCase();
      let localScore = 0;
      if (lowerHtmlLocal.includes('google.com/maps') || lowerHtmlLocal.includes('goo.gl/maps')) localScore += 2;
      if (lowerHtmlLocal.includes('hours of operation') || lowerHtmlLocal.includes('business hours')) localScore += 1;
      if (lowerHtmlLocal.includes('directions') || lowerHtmlLocal.includes('visit us')) localScore += 1;
      if (jsonLdTypes.some(t => t.toLowerCase() === 'localbusiness')) localScore += 1;
      agentNativeScore += Math.min(localScore, weights.localSeoBonus);
    }

    // Semantic HTML (20 points max)
    agentNativeScore += Math.round(semanticHtml.score * 0.2);

    // AI discoverability (20 points max)
    if (llmsTxtFound) agentNativeScore += 7;
    if (aiTxtFound) agentNativeScore += 5;
    if (llmsFullTxtFound) agentNativeScore += 2;
    if (aiPluginJsonFound) agentNativeScore += 3;
    if (appearsInAiSearch) agentNativeScore += 3;

    // Integration signals (15 points max)
    agentNativeScore += Math.min(integrationSignals.length * 3, 15);

    // Apply segment score floor (prevents unfair penalization for non-tech businesses)
    agentNativeScore = Math.max(agentNativeScore, weights.scoreFloor);
    agentNativeScore = Math.min(agentNativeScore, 100);

    // Overall score signal
    if (agentNativeScore >= 60) {
      signals.push(
        `Agent-Native Readiness score: ${agentNativeScore}/100 — this business is well-positioned for AI agent interaction`
      );
    } else if (agentNativeScore >= 30) {
      signals.push(
        `Agent-Native Readiness score: ${agentNativeScore}/100 — partial readiness, significant gaps in AI agent accessibility`
      );
    } else {
      signals.push(
        `Agent-Native Readiness score: ${agentNativeScore}/100 — this business is largely invisible to AI agents`
      );
      recommendations.push(
        "Prioritize agent-native readiness: start with structured data (JSON-LD), semantic HTML, and an llms.txt file — these are the minimum requirements for AI agent discoverability"
      );
    }

    return createEnvelope<AgentNativeAnalysisData>(primitive, startTime, {
      agentNativeScore,
      businessSegment,
      apiPresence,
      structuredData: {
        jsonLdPresent,
        jsonLdTypes,
        schemaOrgCoverage,
        openGraphComplete,
      },
      semanticHtml,
      aiDiscoverability: {
        llmsTxt: llmsTxtFound,
        aiTxt: aiTxtFound,
        llmsFullTxt: llmsFullTxtFound,
        aiPluginJson: aiPluginJsonFound,
        robotsTxtAiDirectives,
        appearsInAiSearch,
        snippetQuality,
      },
      integrationSignals,
      signals,
      recommendations,
    }, {
      confidence,
      confidenceFactors,
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
