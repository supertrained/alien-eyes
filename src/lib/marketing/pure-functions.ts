/**
 * Pure functions extracted from orchestrator.ts for testability.
 * No side effects, no env vars, no external clients.
 */

/** Round large traffic numbers for readability: 967365.399 → "~967K" */
export function formatTraffic(n: number | null | undefined): string {
  if (n == null) return "unknown";
  if (n >= 1_000_000) return `~${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `~${Math.round(n / 1_000)}K`;
  return `~${Math.round(n)}`;
}

export function extractBiggestProblem(outreachMessage: string): string | null {
  // Match the first sentence, but skip dots inside domain-like patterns (word.word)
  // Uses negative lookbehind to avoid matching dots in "supertrained.ai", "example.com", etc.
  const match = outreachMessage.match(/^.+?(?<!\w\.\w)(?<![A-Z])(?<!\w\.\w\.\w)[.!?](?=\s|$)/);
  if (match) return match[0].trim();
  // Fallback: first line
  const firstLine = outreachMessage.split("\n")[0]?.trim();
  return firstLine || null;
}

export function extractRankedProblems(
  results: Record<string, unknown>
): Array<{ rank: number; category: string; title: string; description: string; impact: string }> {
  const problems: Array<{ category: string; title: string; description: string; impact: string }> = [];

  for (const [category, value] of Object.entries(results)) {
    if (!value || typeof value !== "object") continue;
    const v = value as any;

    for (const signal of v.signals ?? []) {
      if (typeof signal === "string") {
        problems.push({
          category,
          title: signal,
          description: "",
          impact: inferImpact(signal, category),
        });
      } else if (signal && typeof signal === "object" && signal.title) {
        problems.push({
          category,
          title: signal.title ?? "",
          description: signal.description ?? "",
          impact: signal.impact ?? "medium",
        });
      }
    }

    for (const issue of v.issues ?? []) {
      if (typeof issue === "string") {
        problems.push({
          category,
          title: issue,
          description: "",
          impact: "medium",
        });
      } else if (issue && typeof issue === "object") {
        if (issue.message) {
          // TrackingIssue format: { severity, category, message }
          problems.push({
            category,
            title: issue.message,
            description: "",
            impact: issue.severity === "critical" ? "high" : issue.severity === "warning" ? "medium" : "low",
          });
        } else if (issue.title) {
          problems.push({
            category,
            title: issue.title ?? "",
            description: issue.description ?? "",
            impact: issue.impact ?? "medium",
          });
        }
      }
    }
  }

  // Sort: critical > high > medium > low
  const impactOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  problems.sort((a, b) => (impactOrder[a.impact] ?? 2) - (impactOrder[b.impact] ?? 2));

  return problems.map((p, i) => ({ ...p, rank: i + 1 }));
}

export function inferImpact(signal: string, _category: string): string {
  const s = signal.toLowerCase();
  if (s.includes("no trust signals") || s.includes("no active") || s.includes("zero")) return "high";
  if (s.includes("poor") || s.includes("very low") || s.includes("very slow")) return "high";
  if (s.includes("critical") || s.includes("no google analytics") || s.includes("no gtm")) return "high";
  // Handle new "could not detect" format from absenceSignal() helper
  if (s.includes("could not detect") && (s.includes("analytics") || s.includes("tracking"))) return "high";
  if (s.includes("could not detect") && s.includes("blog")) return "medium";
  if (s.includes("could not detect") || s.includes("could not find")) return "medium";
  if (s.includes("low") || s.includes("few keywords") || s.includes("no paid")) return "medium";
  if (s.includes("unable to retrieve")) return "medium";
  return "medium";
}

export function countIssues(results: Record<string, unknown>): number {
  let count = 0;
  for (const value of Object.values(results)) {
    if (value && typeof value === "object" && "signals" in (value as any)) {
      count += ((value as any).signals ?? []).length;
    }
    if (value && typeof value === "object" && "issues" in (value as any)) {
      count += ((value as any).issues ?? []).length;
    }
  }
  return count;
}

export function countPrimitives(results: Record<string, unknown>): number {
  return Object.values(results).filter((v) => v !== null).length;
}

/** Valid CHECK constraint values for audit_opinion in the reports table */
export const VALID_AUDIT_OPINIONS = ["Sound", "Qualified", "Deficient", "Incomplete"] as const;
export type AuditOpinion = (typeof VALID_AUDIT_OPINIONS)[number];

export function isValidAuditOpinion(value: unknown): value is AuditOpinion {
  return typeof value === "string" && (VALID_AUDIT_OPINIONS as readonly string[]).includes(value);
}

/**
 * Parse the Tier 1 synthesis response from the LLM.
 *
 * The LLM should return JSON with outreach_message, ranked_problems,
 * biggest_problem, audit_opinion, and dimension_categories. But LLMs are
 * unreliable, so we have 3 fallback paths:
 *
 * 1. Direct JSON.parse of the full response
 * 2. Regex extract {...} then JSON.parse (handles markdown wrapping)
 * 3. Use raw content as outreach_message, everything else null
 */
export interface Tier1ParsedResult {
  outreachMessage: string;
  rankedProblems: Array<{
    rank: number;
    title: string;
    description: string;
    impact: string;
    category: string;
    data_point: string;
    opportunity: string;
    criteria?: string;
    confidence_level?: string;
    consequence?: string;
    corrective_action?: string;
  }> | null;
  biggestProblem: string | null;
  auditOpinion: string | null;
  dimensionCategories: Record<string, unknown> | null;
}

export function parseTier1Response(content: string): Tier1ParsedResult {
  const fallback: Tier1ParsedResult = {
    outreachMessage: content,
    rankedProblems: null,
    biggestProblem: null,
    auditOpinion: null,
    dimensionCategories: null,
  };

  if (!content || !content.trim()) {
    return fallback;
  }

  // Path 1: Direct JSON.parse
  try {
    const parsed = JSON.parse(content);
    return {
      outreachMessage: parsed.outreach_message ?? content,
      rankedProblems: parsed.ranked_problems ?? null,
      biggestProblem: parsed.biggest_problem ?? null,
      auditOpinion: parsed.audit_opinion ?? null,
      dimensionCategories: parsed.dimension_categories ?? null,
    };
  } catch {
    // Path 2: Regex extract {...} then JSON.parse
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          outreachMessage: parsed.outreach_message ?? content,
          rankedProblems: parsed.ranked_problems ?? null,
          biggestProblem: parsed.biggest_problem ?? null,
          auditOpinion: parsed.audit_opinion ?? null,
          dimensionCategories: parsed.dimension_categories ?? null,
        };
      } catch {
        // Path 3: raw fallback
        return fallback;
      }
    } else {
      // Path 3: raw fallback (no JSON-like content at all)
      return fallback;
    }
  }
}

/** MHAS: Compute overall audit opinion from ranked problems and confidence data */
export function computeAuditOpinion(
  rankedProblems: Array<{ impact: string }>,
  _confidenceMap: Map<string, number>
): string {
  const criticalCount = rankedProblems.filter((p) => p.impact === "critical").length;
  const highCount = rankedProblems.filter((p) => p.impact === "high").length;
  const significantCount = criticalCount + highCount;

  if (criticalCount >= 1 || significantCount >= 3) return "Deficient";
  if (significantCount >= 1) return "Qualified";
  if (rankedProblems.length < 3) return "Sound";
  return "Qualified";
}

/** MHAS: Compute per-dimension category (N/A=0, NoIssues=1, Minor=2, Significant=3, Critical=4) */
export function computeDimensionCategories(
  results: Record<string, unknown>,
  confidenceMapRaw: Map<string, { confidence: number; status: string }>
): Record<string, number> {
  const categories: Record<string, number> = {};
  const dimensionKeys = [
    "trafficAnalysis", "websiteCro", "trackingAnalytics",
    "metaAds", "googleAds", "emailAnalysis",
    "competitorContext", "companyEnrichment",
    "brandReputation", "socialOrganic", "pricingMonetization",
    "meoAnalysis", "agentNative",
    // Split primitives (future Phase B — currently null, no impact)
    "websiteTechnical", "websiteMessaging", "contentPresence",
  ];

  for (const key of dimensionKeys) {
    const rawInfo = confidenceMapRaw.get(key);
    const value = results[key];

    // Failed or missing → N/A
    if (!value || !rawInfo || rawInfo.status === "error" || rawInfo.confidence < 0.3) {
      categories[key] = 0; // N/A
      continue;
    }

    // Count signals/issues for this dimension
    const v = value as any;
    const signals = (v.signals ?? []) as Array<string | { impact?: string }>;
    const issues = (v.issues ?? []) as Array<string | { severity?: string }>;

    const hasCritical = issues.some(
      (i) => typeof i === "object" && i.severity === "critical"
    );
    const hasWarning = issues.some(
      (i) => typeof i === "object" && i.severity === "warning"
    );
    const problemSignalCount = signals.filter((s) => {
      const text = typeof s === "string" ? s : "";
      return /no |poor |very low|very slow|zero|unable|not detected|missing|could not detect|could not find/i.test(text);
    }).length;

    if (hasCritical || problemSignalCount >= 3) {
      categories[key] = 4; // Critical
    } else if (hasWarning || problemSignalCount >= 2) {
      categories[key] = 3; // Significant
    } else if (problemSignalCount >= 1) {
      categories[key] = 2; // Minor
    } else {
      categories[key] = 1; // No Issues Identified
    }
  }

  return categories;
}
