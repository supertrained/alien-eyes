import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { Envelope } from "@marketing/envelope";
import { complete } from "@marketing/models";
import { isDryRun, shouldSaveFixtures, loadFixture, saveFixture } from "@marketing/dry-run";
import { runTrafficAnalysis } from "@/primitives/marketing/traffic-analysis";
import { runWebsiteCro } from "@/primitives/marketing/website-cro";
import { runTrackingAnalytics } from "@/primitives/marketing/tracking-analytics";
import { runMetaAds } from "@/primitives/marketing/meta-ads";
import { runGoogleAds } from "@/primitives/marketing/google-ads";
import { runEmailAnalysis } from "@/primitives/marketing/email-analysis";
import { runCompetitorContext } from "@/primitives/marketing/competitor-context";
import { runCompanyEnrichment } from "@/primitives/marketing/company-enrichment";
import { runMeoAnalysis } from "@/primitives/marketing/meo-analysis";
import { runAgentNativeAnalysis } from "@/primitives/marketing/agent-native-analysis";
import { runBrandReputation } from "@/primitives/marketing/brand-reputation";
import { runSocialOrganic } from "@/primitives/marketing/social-organic";
import { runPricingMonetization } from "@/primitives/marketing/pricing-monetization";
import {
  SYNTHESIS_SYSTEM_PROMPT,
  buildTier1OutreachPrompt,
  buildTier2LoomScriptPrompt,
  buildMiniSynthesisPrompt,
} from "@marketing/synthesis/prompts";
import { isDomainOptedOut } from "@marketing/optout";
import { getCachedResult, setCachedResult } from "@marketing/domain-cache";
import { computeCrossDimensionalPatterns, computeMarketingMaturity, buildIndustryContext } from "@marketing/analysis/patterns";
import { executeDag, type PrimitiveRunner } from "@marketing/dag-executor";
import {
  formatTraffic,
  extractBiggestProblem,
  extractRankedProblems,
  inferImpact,
  countIssues,
  countPrimitives,
  computeAuditOpinion,
  computeDimensionCategories,
} from "@marketing/pure-functions";
import type { IndustryCheckResult } from "@marketing/industry-checks";
import { createLogger } from "@marketing/logger";

// Re-export pure functions so existing imports keep working
export {
  formatTraffic,
  extractBiggestProblem,
  extractRankedProblems,
  inferImpact,
  countIssues,
  countPrimitives,
  computeAuditOpinion,
  computeDimensionCategories,
} from "@marketing/pure-functions";

// --- Structured logging helpers (delegate to JSON logger) ---
function log(scanId: string, primitive: string, message: string) {
  const logger = createLogger({ scanId, primitive });
  logger.info(message);
}

function logWarn(scanId: string, primitive: string, message: string) {
  const logger = createLogger({ scanId, primitive });
  logger.warn(message);
}

function logError(scanId: string, primitive: string, message: string, error?: unknown) {
  const logger = createLogger({ scanId, primitive });
  logger.error(message, undefined, error);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

const TIER2_ENABLED = process.env.TIER2_ENABLED === "true";

const MAX_SCAN_COST_USD = 10.00;

/** Run a primitive or load from fixture in dry-run mode. Save fixture if SAVE_FIXTURES=true. */
async function runPrimitive(
  scanId: string,
  domain: string,
  primitiveName: string,
  runner: () => Promise<Envelope>
): Promise<Envelope> {
  if (isDryRun()) {
    const fixture = loadFixture(domain, primitiveName);
    if (fixture) {
      log(scanId, primitiveName, "Loaded fixture (dry-run)");
      return fixture;
    }
    logWarn(scanId, primitiveName, "No fixture — running live (dry-run)");
  }
  const result = await runner();
  if (shouldSaveFixtures() && result.status === "success") {
    saveFixture(domain, primitiveName, result);
    log(scanId, primitiveName, `Saved fixture for ${domain}`);
  }
  return result;
}


async function updateScanProgress(
  scanId: string,
  status: "running" | "synthesizing",
  progress: number,
  phase?: "foundation" | "enrichment" | "email_monitoring" | "synthesis"
): Promise<void> {
  await supabase
    .from("scans")
    .update({
      status,
      progress,
      phase: phase ?? null,
    })
    .eq("id", scanId);
}

/** Upsert "running" placeholder rows so the SSE stream can show per-primitive progress.
 *  Uses upsert with ignoreDuplicates so BullMQ retries are idempotent. */
async function markPrimitivesRunning(
  scanId: string,
  primitives: string[]
): Promise<void> {
  const rows = primitives.map((p) => ({
    scan_id: scanId,
    primitive: p,
    status: "running",
    started_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("primitive_results").upsert(rows, {
    onConflict: "scan_id,primitive",
    ignoreDuplicates: true,
  });
  if (error) {
    logWarn(scanId, "orchestrator", `Failed to upsert running rows: ${error.message}`);
    // Non-fatal — scan continues without real-time progress tracking
  }
}

async function storePrimitiveResult(
  scanId: string,
  primitive: string,
  envelope: Envelope
): Promise<void> {
  // Use upsert (not update) so results are persisted even if markPrimitivesRunning
  // failed to create the placeholder row — prevents silent data loss.
  const { error } = await supabase
    .from("primitive_results")
    .upsert({
      scan_id: scanId,
      primitive: primitive,
      status: envelope.status,
      data: envelope.data,
      confidence: envelope.confidence,
      confidence_factors: envelope.confidenceFactors,
      reasoning: envelope.reasoning ?? null,
      error_message: envelope.status === "error" ? (envelope.reasoning ?? null) : null,
      model_used: envelope.metadata.model ?? null,
      tokens_used: envelope.metadata.tokensUsed ?? 0,
      cost_usd: envelope.metadata.costUsd ?? 0,
      duration_ms: envelope.metadata.durationMs,
      completed_at: new Date().toISOString(),
    }, { onConflict: "scan_id,primitive" });
  if (error) {
    logError(scanId, primitive, `Failed to store result: ${error.message}`);
  }
}

export async function processScan(
  scanId: string,
  domain: string,
  url: string,
  deepAnalysis = false,
  forceRefresh = false
): Promise<void> {
  const startTime = Date.now();

  // Check domain opt-out before scanning
  if (await isDomainOptedOut(domain)) {
    await supabase
      .from("scans")
      .update({
        status: "failed",
        error_message: "This domain has opted out of scanning",
      })
      .eq("id", scanId);
    return;
  }

  // Fetch scan to get org_id for report insertion
  const { data: scanRow } = await supabase
    .from("scans")
    .select("org_id, submitted_by, deep_analysis, callback_url, callback_meta")
    .eq("id", scanId)
    .single();

  if (!scanRow) throw new Error(`Scan ${scanId} not found`);
  const orgId = scanRow.org_id;
  // Use DB value if available, fallback to job parameter
  const isDeepAnalysis = scanRow.deep_analysis ?? deepAnalysis;

  // Resolve org config early — needed for synthesis template + notification email
  const { getConfigForOrg } = await import("@marketing/agency-config");
  const orgConfig = await getConfigForOrg(orgId);

  try {
    // -------------------------------------------------------
    // DAG-based primitive execution (replaces Phase 1 + Phase 2)
    // -------------------------------------------------------
    await updateScanProgress(scanId, "running", 10, "foundation");

    // Cost tracking — abort if a scan exceeds the safety cap
    let accumulatedCost = 0;

    function checkCostCap(): void {
      if (accumulatedCost > MAX_SCAN_COST_USD) {
        throw new Error(
          `Scan aborted: cost cap exceeded ($${accumulatedCost.toFixed(2)} > $${MAX_SCAN_COST_USD})`
        );
      }
    }

    // Run + store each primitive immediately on completion (not batched)
    // so the SSE stream shows genuinely incremental progress.
    // Checks domain cache first unless forceRefresh is set.
    async function runAndStore(primitiveName: string, runner: () => Promise<Envelope>): Promise<Envelope> {
      // Check domain cache first (unless force_refresh)
      if (!forceRefresh) {
        try {
          const cached = await getCachedResult(domain, primitiveName);
          if (cached) {
            log(scanId, primitiveName, `Using cached result (cached ${cached.cached_at})`);
            const envelope: Envelope = {
              primitive: primitiveName,
              status: "success",
              data: cached.data,
              confidence: cached.confidence,
              confidenceFactors: [...cached.confidenceFactors, "from domain cache"],
              metadata: {
                model: cached.model_used ?? undefined,
                tokensUsed: cached.tokens_used,
                costUsd: 0, // Don't charge for cached results
                durationMs: 0,
              },
            };
            await storePrimitiveResult(scanId, primitiveName, envelope);
            return envelope;
          }
        } catch (cacheErr) {
          logWarn(scanId, primitiveName, `Cache lookup failed, running fresh: ${cacheErr}`);
        }
      }

      const result = await runPrimitive(scanId, domain, primitiveName, runner);
      await storePrimitiveResult(scanId, primitiveName, result);
      accumulatedCost += result.metadata.costUsd ?? 0;
      checkCostCap();

      // Cache successful results (fire-and-forget, with contributing org for GDPR)
      if (result.status === "success") {
        setCachedResult(domain, primitiveName, result, orgId).catch((err) =>
          logWarn(scanId, primitiveName, `Cache write failed: ${err}`)
        );
      }

      // Track for mini-synthesis (progressive report delivery)
      completedResults.set(primitiveName, result);

      return result;
    }

    // Helper: extract enrichment data from resolved deps
    function getEnrichmentFromDeps(deps: Map<string, Envelope>) {
      const enrichment = deps.get("company_enrichment");
      const enrichmentData = enrichment?.data as any;
      const companyName = enrichmentData?.company?.name ?? domain;
      const alternateNames: string[] = [];
      if (enrichmentData?.company?.alternateNames) {
        alternateNames.push(...enrichmentData.company.alternateNames);
      }
      if (enrichmentData?.company?.legalName && enrichmentData.company.legalName !== companyName) {
        alternateNames.push(enrichmentData.company.legalName);
      }
      if (enrichmentData?.company?.parentCompany) {
        alternateNames.push(enrichmentData.company.parentCompany);
      }
      // Extract social page names for Meta ad search
      const socialLinks = enrichmentData?.company?.facebookUrl
        ? [enrichmentData.company.facebookUrl]
        : [];
      return {
        companyName,
        alternateNames,
        socialLinks,
        industry: enrichmentData?.company?.industry,
        subIndustry: enrichmentData?.company?.subIndustry,
        description: enrichmentData?.company?.description,
        keywords: enrichmentData?.company?.keywords,
      };
    }

    // Build runners for each primitive
    const runners = new Map<string, PrimitiveRunner>();

    runners.set("traffic_analysis", () =>
      runAndStore("traffic_analysis", () => runTrafficAnalysis(domain))
    );
    runners.set("website_cro", () =>
      runAndStore("website_cro", () => runWebsiteCro(url, scanId))
    );
    runners.set("tracking_analytics", () =>
      runAndStore("tracking_analytics", () => runTrackingAnalytics(url, domain))
    );
    runners.set("meo_analysis", () =>
      runAndStore("meo_analysis", () => runMeoAnalysis(url, domain))
    );
    runners.set("agent_native", () =>
      runAndStore("agent_native", () => runAgentNativeAnalysis(url, domain))
    );
    runners.set("brand_reputation", (deps) => {
      const { companyName } = getEnrichmentFromDeps(deps);
      return runAndStore("brand_reputation", () => runBrandReputation(domain, companyName));
    });
    runners.set("social_organic", () =>
      runAndStore("social_organic", () => runSocialOrganic(url, domain))
    );
    runners.set("pricing_monetization", () =>
      runAndStore("pricing_monetization", () => runPricingMonetization(url))
    );
    runners.set("meta_ads", async (deps) => {
      const { companyName, alternateNames, socialLinks } = getEnrichmentFromDeps(deps);
      // Extract Facebook page name from Apollo social link for more accurate Ad Library search
      let facebookPageName: string | undefined;
      if (socialLinks && socialLinks.length > 0) {
        const { extractSocialPageName } = await import("@marketing/social-links");
        for (const link of socialLinks) {
          if (link.includes("facebook.com")) {
            facebookPageName = extractSocialPageName(link) ?? undefined;
            break;
          }
        }
      }
      return runAndStore("meta_ads", () => runMetaAds(companyName, domain, scanId, alternateNames, facebookPageName));
    });
    runners.set("google_ads", (deps) => {
      const { companyName, alternateNames } = getEnrichmentFromDeps(deps);
      return runAndStore("google_ads", () => runGoogleAds(domain, scanId, companyName, alternateNames));
    });
    runners.set("competitor_context", (deps) => {
      const { industry, subIndustry, description, keywords } = getEnrichmentFromDeps(deps);
      const trafficEnv = deps.get("traffic_analysis");
      const organicTraffic = (trafficEnv?.data as any)?.traffic?.organicTraffic ?? null;
      return runAndStore("competitor_context", () =>
        runCompetitorContext(domain, { industry, subIndustry, description, keywords }, organicTraffic)
      );
    });

    // Email analysis: observation-only when AgentMail key missing or non-deep scan
    const emailObservationOnly = !isDeepAnalysis || !process.env.AGENTMAIL_API_KEY;
    runners.set("email_analysis", () =>
      runAndStore("email_analysis", () => runEmailAnalysis(url, scanId, emailObservationOnly))
    );
    runners.set("company_enrichment", () =>
      runAndStore("company_enrichment", () => runCompanyEnrichment(domain, !isDeepAnalysis))
    );

    // All registered runners are the enabled primitives
    const enabledPrimitives = [...runners.keys()];

    // Mark all primitives as running for SSE
    await markPrimitivesRunning(scanId, enabledPrimitives);

    // Progressive report delivery: track completed results and trigger mini-synthesis
    let miniSynthesisTriggered = false;
    const completedResults = new Map<string, Envelope>();

    const CAMEL_KEY_MAP: Record<string, string> = {
      traffic_analysis: "trafficAnalysis",
      website_cro: "websiteCro",
      tracking_analytics: "trackingAnalytics",
      meta_ads: "metaAds",
      google_ads: "googleAds",
      email_analysis: "emailAnalysis",
      competitor_context: "competitorContext",
      company_enrichment: "companyEnrichment",
      meo_analysis: "meoAnalysis",
      agent_native: "agentNative",
      brand_reputation: "brandReputation",
      social_organic: "socialOrganic",
      pricing_monetization: "pricingMonetization",
      website_technical: "websiteTechnical",
      website_messaging: "websiteMessaging",
      content_presence: "contentPresence",
    };

    async function triggerMiniSynthesis(completed: number, total: number): Promise<void> {
      try {
        const partialResults: Record<string, unknown> = {};
        for (const [name, envelope] of completedResults) {
          if (envelope.status === "success" && envelope.data) {
            const camelKey = CAMEL_KEY_MAP[name] ?? name;
            partialResults[camelKey] = envelope.data;
          }
        }

        const companyName = (partialResults.companyEnrichment as any)?.company?.name ?? domain;
        const prompt = buildMiniSynthesisPrompt(partialResults, companyName, completed, total);

        const miniResult = await complete("haiku", [{ role: "user", content: prompt }], {
          temperature: 0.3,
        });

        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(miniResult.content);
        } catch {
          const jsonMatch = miniResult.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        }

        if (parsed.biggest_problem || parsed.ranked_problems) {
          await supabase.from("reports").upsert({
            scan_id: scanId,
            org_id: orgId,
            outreach_message: `Preliminary analysis — ${completed}/${total} dimensions complete. Full report in progress.`,
            outreach_message_raw: null,
            loom_script: null,
            ranked_problems: parsed.ranked_problems ?? [],
            biggest_problem: parsed.biggest_problem ?? null,
            audit_opinion: String(parsed.audit_opinion ?? "Incomplete"),
            dimension_categories: {},
            synthesis_model: "claude-haiku-4-5",
            synthesis_tokens: miniResult.usage.inputTokens + miniResult.usage.outputTokens,
            synthesis_cost_usd: miniResult.usage.cost ?? 0,
          }, { onConflict: "scan_id" });

          // Signal frontend that preliminary results are available
          await supabase.from("scans").update({ preview_ready: true }).eq("id", scanId);

          log(scanId, "mini-synthesis", `Preview ready (${completed}/${total} primitives)`);
        }
      } catch (err) {
        logWarn(scanId, "mini-synthesis", `Failed (non-blocking): ${err}`);
      }
    }

    // Execute DAG — shouldAbort stops launching new primitives if cost cap hit
    const dagResult = await executeDag(
      enabledPrimitives,
      runners,
      {
        onProgress: (completed, total, primitive) => {
          const progress = 10 + Math.round((completed / total) * 65);
          updateScanProgress(scanId, "running", progress, "foundation").catch(() => {});

          // Fire mini-synthesis after 3+ primitives complete (non-blocking, once)
          if (completed >= 3 && !miniSynthesisTriggered) {
            miniSynthesisTriggered = true;
            triggerMiniSynthesis(completed, total).catch(() => {});
          }
        },
        onStart: (primitive) => {
          log(scanId, primitive, "Starting");
        },
        shouldAbort: () => accumulatedCost > MAX_SCAN_COST_USD,
      }
    );

    // Extract results by name (null if primitive didn't run)
    const getResult = (name: string): Envelope | null =>
      dagResult.results.get(name) ?? null;

    const trafficResult = getResult("traffic_analysis")!;
    const croResult = getResult("website_cro")!;
    const trackingResult = getResult("tracking_analytics")!;
    const meoResult = getResult("meo_analysis")!;
    const agentNativeResult = getResult("agent_native")!;
    const emailResult = getResult("email_analysis");
    const enrichmentResult = getResult("company_enrichment");
    const metaAdsResult = getResult("meta_ads")!;
    const googleAdsResult = getResult("google_ads")!;
    const competitorResult = getResult("competitor_context")!;
    const brandReputationResult = getResult("brand_reputation");
    const socialOrganicResult = getResult("social_organic");
    const pricingResult = getResult("pricing_monetization");

    const enrichmentData = enrichmentResult?.data as any;
    const companyName = enrichmentData?.company?.name ?? domain;

    // -------------------------------------------------------
    // Industry-specific analysis (uses agent_native segment + website HTML)
    // -------------------------------------------------------
    let industryCheckResult: IndustryCheckResult | null = null;
    const agentNativeData = agentNativeResult?.data as any;
    const websiteCroData = croResult?.data as any;
    if (agentNativeData?.businessSegment && agentNativeData.businessSegment !== "other") {
      try {
        const { getIndustryChecks } = await import("@marketing/industry-checks");
        const pageHtml = websiteCroData?.fullPageHtml ?? "";
        industryCheckResult = await getIndustryChecks(agentNativeData.businessSegment, domain, pageHtml);
        log(scanId, "industry_checks", `${industryCheckResult?.signals.length ?? 0} industry signals for ${agentNativeData.businessSegment}`);
      } catch (err) {
        logWarn(scanId, "industry_checks", `Failed: ${err}`);
      }
    }

    await updateScanProgress(scanId, "running", 75, "enrichment");

    // -------------------------------------------------------
    // Phase 3: Email monitoring (fire and forget — deep analysis only)
    // -------------------------------------------------------
    const emailData = emailResult?.data as any;
    if (TIER2_ENABLED && isDeepAnalysis && emailData?.inboxId) {
      try {
        const redis = new IORedis(process.env.REDIS_URL!, {
          maxRetriesPerRequest: null,
        });
        const emailQueue = new Queue("email-poll-queue", {
          connection: redis as unknown as import("bullmq").ConnectionOptions,
        });

        // Schedule polls at 2h, 6h, 24h, 48h
        for (const delayMs of [
          2 * 60 * 60 * 1000,
          6 * 60 * 60 * 1000,
          24 * 60 * 60 * 1000,
          48 * 60 * 60 * 1000,
        ]) {
          await emailQueue.add(
            "poll",
            { scanId, inboxId: emailData.inboxId },
            { delay: delayMs }
          );
        }

        await redis.quit();
      } catch (err) {
        logError(scanId, "email_monitoring", "Failed to schedule email polls", err);
      }
    }

    // -------------------------------------------------------
    // Phase 4: Synthesis with extended thinking
    // -------------------------------------------------------
    await updateScanProgress(scanId, "synthesizing", 80, "synthesis");

    // Round traffic numbers for readability in synthesis
    const trafficData = trafficResult.data as Record<string, unknown> | null;
    if (trafficData?.traffic && typeof trafficData.traffic === "object") {
      const t = trafficData.traffic as Record<string, unknown>;
      if (typeof t.organicTraffic === "number") {
        t.organicTrafficFormatted = formatTraffic(t.organicTraffic as number);
      }
      if (typeof t.paidTraffic === "number") {
        t.paidTrafficFormatted = formatTraffic(t.paidTraffic as number);
      }
    }

    // Build per-primitive confidence summary for synthesis awareness
    const confidenceSummary: Record<string, { confidence: number; factors: string[] }> = {};
    for (const [name, env] of completedResults.entries()) {
      const camelKey = CAMEL_KEY_MAP[name] ?? name;
      confidenceSummary[camelKey] = {
        confidence: env.confidence,
        factors: env.confidenceFactors ?? [],
      };
    }

    const allResults = {
      trafficAnalysis: trafficResult.data,
      websiteCro: croResult.data,
      trackingAnalytics: trackingResult.data,
      metaAds: metaAdsResult.data,
      googleAds: googleAdsResult.data,
      emailAnalysis: emailResult?.data ?? null,
      competitorContext: competitorResult.data,
      companyEnrichment: enrichmentResult?.data ?? null,
      meoAnalysis: meoResult.data,
      agentNative: agentNativeResult.data,
      brandReputation: brandReputationResult?.data ?? null,
      socialOrganic: socialOrganicResult?.data ?? null,
      pricingMonetization: pricingResult?.data ?? null,
      _confidence: confidenceSummary,
    };

    // -------------------------------------------------------
    // Pre-Synthesis: Cross-Dimensional Analysis
    // -------------------------------------------------------
    const crossDimensionalPatterns = computeCrossDimensionalPatterns(allResults);
    const marketingMaturity = computeMarketingMaturity(allResults);
    const industryContext = buildIndustryContext(enrichmentResult?.data);

    // Add cross-dimensional analysis to results for synthesis
    const synthesisResults = {
      ...allResults,
      _crossDimensionalPatterns: crossDimensionalPatterns,
      _marketingMaturity: marketingMaturity,
      _industryContext: industryContext,
      _industryChecks: industryCheckResult,
    };

    // Collect screenshot paths before synthesis (needed by Tier 2)
    const screenshotPaths: string[] = [];
    const croData = croResult.data as any;
    if (croData?.screenshots?.desktopPath) screenshotPaths.push(croData.screenshots.desktopPath);
    if (croData?.screenshots?.mobilePath) screenshotPaths.push(croData.screenshots.mobilePath);
    const metaData = metaAdsResult.data as any;
    if (metaData?.screenshotPaths) screenshotPaths.push(...metaData.screenshotPaths);
    const googleData = googleAdsResult.data as any;
    if (googleData?.screenshotPaths) screenshotPaths.push(...googleData.screenshotPaths);
    const emailFormData = emailResult?.data as any;
    if (emailFormData?.screenshotPath) screenshotPaths.push(emailFormData.screenshotPath);

    // Build prompts for both tiers (with per-agency synthesis template if configured)
    const tier1Prompt = buildTier1OutreachPrompt(
      synthesisResults,
      companyName,
      undefined, // PII stripped — no individual contact name
      orgConfig.synthesisTemplate
    );
    const tier2Prompt = buildTier2LoomScriptPrompt(
      synthesisResults,
      companyName,
      screenshotPaths,
      orgConfig.synthesisTemplate,
      orgConfig.loomStyle
    );

    // Run Tier 1 (outreach + ranked problems) and Tier 2 (Loom script) in parallel
    // They're independent — both read from synthesisResults, neither depends on the other
    const [tier1Result, tier2Result] = await Promise.all([
      complete("opus", [
        { role: "user", content: tier1Prompt },
      ], {
        system: SYNTHESIS_SYSTEM_PROMPT,
        temperature: 0.7,
      }),
      complete("opus", [
        { role: "user", content: tier2Prompt },
      ], {
        system: SYNTHESIS_SYSTEM_PROMPT,
        temperature: 0.5,
      }),
    ]);

    accumulatedCost += (tier1Result.usage.cost ?? 0) + (tier2Result.usage.cost ?? 0);
    checkCostCap();

    // Parse Tier 1: structured synthesis output (outreach + ranked problems)
    let outreachMessage: string;
    let llmRankedProblems: Array<{
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
    }> | null = null;
    let llmBiggestProblem: string | null = null;
    let llmAuditOpinion: string | null = null;
    let llmDimensionCategories: Record<string, unknown> | null = null;

    try {
      const parsed = JSON.parse(tier1Result.content);
      outreachMessage = parsed.outreach_message ?? tier1Result.content;
      llmRankedProblems = parsed.ranked_problems ?? null;
      llmBiggestProblem = parsed.biggest_problem ?? null;
      llmAuditOpinion = parsed.audit_opinion ?? null;
      llmDimensionCategories = parsed.dimension_categories ?? null;
    } catch {
      const jsonMatch = tier1Result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          outreachMessage = parsed.outreach_message ?? tier1Result.content;
          llmRankedProblems = parsed.ranked_problems ?? null;
          llmBiggestProblem = parsed.biggest_problem ?? null;
          llmAuditOpinion = parsed.audit_opinion ?? null;
          llmDimensionCategories = parsed.dimension_categories ?? null;
        } catch {
          outreachMessage = tier1Result.content;
        }
      } else {
        outreachMessage = tier1Result.content;
      }
    }

    // Parse Tier 2: Loom script
    let tier2Script: unknown;
    try {
      tier2Script = JSON.parse(tier2Result.content);
    } catch {
      const jsonMatch = tier2Result.content.match(/\{[\s\S]*\}/);
      tier2Script = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: tier2Result.content };
    }

    // Humanizer pass — remove AI writing patterns and add human voice
    // Based on Wikipedia's "Signs of AI writing" (24 detection patterns)
    const humanizedResult = await complete("sonnet", [
      { role: "user", content: `You are a writing editor removing signs of AI-generated text. Rewrite this outreach message so it sounds like a real human wrote it.

DETECT AND FIX THESE AI PATTERNS:

1. SIGNIFICANCE INFLATION — Remove "testament to", "pivotal", "crucial", "vital role", "underscores", "evolving landscape". Just state facts.
2. PROMOTIONAL LANGUAGE — Remove "groundbreaking", "renowned", "vibrant", "rich", "stunning", "nestled". Use plain descriptions.
3. SUPERFICIAL -ING PHRASES — Remove "highlighting...", "showcasing...", "reflecting...", "emphasizing...". They add fake depth.
4. AI VOCABULARY — Remove "Additionally", "delve", "enhance", "foster", "garner", "intricate", "interplay", "tapestry", "underscore", "landscape" (abstract). Replace with plain words.
5. COPULA AVOIDANCE — Replace "serves as", "stands as", "represents" with simple "is/are/has".
6. NEGATIVE PARALLELISMS — Remove "Not only...but also..." and "It's not just about X, it's about Y".
7. RULE OF THREE — Don't force everything into groups of three. Two is fine. Four is fine.
8. ELEGANT VARIATION — Don't cycle through synonyms to avoid repeating a word. Just repeat it.
9. EM DASH OVERUSE — Use commas or periods instead of dashes unless a dash genuinely fits.
10. FILLER PHRASES — Cut "In order to", "It is important to note", "Due to the fact that", "At this point in time".
11. EXCESSIVE HEDGING — Cut "could potentially", "it might be argued that". Say it directly.
12. GENERIC CONCLUSIONS — No "The future looks bright" or "exciting times ahead". End with specifics.
13. SYCOPHANTIC TONE — No "Great question!", "Absolutely!", "That's an excellent point".
14. FALSE RANGES — Don't use "from X to Y" unless X and Y are on a meaningful scale.

ADD HUMAN VOICE:
- Vary sentence length. Short punches. Then a longer one that takes its time.
- Have an opinion — don't just neutrally report.
- Use contractions (you're, they're, isn't, don't).
- Be specific about what you noticed, not vague about what "could be improved".
- Let some natural asymmetry in — not every point needs equal weight.

CONSTRAINTS:
- Keep it under 150 words
- Maintain ALL specific data points and numbers exactly
- Keep the peer tone — sharp, helpful, not salesy
- The CTA must remain: "Want me to record a 3-minute walkthrough of everything I found?"
- Do NOT add subject lines, greetings like "Hi [Name]," or formatting labels
- Return ONLY the message text, nothing else

SELF-AUDIT: After rewriting, ask yourself "What still sounds obviously AI-generated?" and fix those tells.

Original:
${outreachMessage}` },
    ], { temperature: 0.8 });

    accumulatedCost += humanizedResult.usage.cost ?? 0;
    checkCostCap();

    const outreachMessageRaw = outreachMessage;
    outreachMessage = humanizedResult.content.trim();

    await updateScanProgress(scanId, "synthesizing", 90, "synthesis");

    // -------------------------------------------------------
    // Store report
    // -------------------------------------------------------
    const synthesisCost = (tier1Result.usage.cost ?? 0) + (tier2Result.usage.cost ?? 0) + (humanizedResult.usage.cost ?? 0);
    const totalCost =
      synthesisCost +
      [
        trafficResult,
        croResult,
        trackingResult,
        emailResult,
        enrichmentResult,
        metaAdsResult,
        googleAdsResult,
        competitorResult,
        meoResult,
        agentNativeResult,
        brandReputationResult,
        socialOrganicResult,
        pricingResult,
      ].reduce((sum, r) => sum + (r?.metadata.costUsd ?? 0), 0);

    const synthesisTokens =
      tier1Result.usage.inputTokens + tier1Result.usage.outputTokens +
      tier2Result.usage.inputTokens + tier2Result.usage.outputTokens +
      humanizedResult.usage.inputTokens + humanizedResult.usage.outputTokens;

    // Build confidence map for MHAS computation
    const confidenceMap = new Map<string, number>();
    const confidenceMapRaw = new Map<string, { confidence: number; status: string }>();
    const allPrimitiveResults = [
      { name: "trafficAnalysis", result: trafficResult },
      { name: "websiteCro", result: croResult },
      { name: "trackingAnalytics", result: trackingResult },
      { name: "metaAds", result: metaAdsResult },
      { name: "googleAds", result: googleAdsResult },
      { name: "emailAnalysis", result: emailResult },
      { name: "competitorContext", result: competitorResult },
      { name: "companyEnrichment", result: enrichmentResult },
      { name: "meoAnalysis", result: meoResult },
      { name: "agentNative", result: agentNativeResult },
      { name: "brandReputation", result: brandReputationResult },
      { name: "socialOrganic", result: socialOrganicResult },
      { name: "pricingMonetization", result: pricingResult },
    ];
    for (const { name, result } of allPrimitiveResults) {
      if (result) {
        confidenceMap.set(name, result.confidence);
        confidenceMapRaw.set(name, { confidence: result.confidence, status: result.status });
      }
    }

    // Use LLM-generated ranked problems if available, fallback to extraction
    const rankedProblems = llmRankedProblems
      ? llmRankedProblems.map((p, i) => ({ ...p, rank: p.rank ?? i + 1 }))
      : extractRankedProblems(allResults);

    const biggestProblem = llmBiggestProblem ?? extractBiggestProblem(outreachMessage);

    // Compute MHAS audit opinion if not provided by LLM
    // Validate LLM output against CHECK constraint — reject invalid values to prevent upsert failure
    const VALID_OPINIONS = new Set(["Sound", "Qualified", "Deficient", "Incomplete"]);
    const auditOpinion = (llmAuditOpinion && VALID_OPINIONS.has(llmAuditOpinion))
      ? llmAuditOpinion
      : computeAuditOpinion(rankedProblems, confidenceMap);

    // Compute per-dimension MHAS categories if not provided by LLM
    const dimensionCategories = llmDimensionCategories ?? computeDimensionCategories(allResults, confidenceMapRaw);
    // Add marketing maturity as a summary field
    const dimensionCategoriesWithMaturity = {
      ...dimensionCategories,
      _marketingMaturity: marketingMaturity,
      _crossDimensionalPatterns: crossDimensionalPatterns,
    };

    const { error: reportError } = await supabase.from("reports").upsert({
      scan_id: scanId,
      org_id: orgId,
      outreach_message: outreachMessage,
      outreach_message_raw: outreachMessageRaw,
      loom_script: tier2Script,
      ranked_problems: rankedProblems,
      biggest_problem: biggestProblem,
      audit_opinion: auditOpinion,
      dimension_categories: dimensionCategoriesWithMaturity,
      synthesis_model: "claude-opus-4-6",
      synthesis_tokens: synthesisTokens,
      synthesis_cost_usd: synthesisCost,
    }, { onConflict: "scan_id" });

    if (reportError) {
      throw new Error(`Failed to store report: ${reportError.message}`);
    }

    // Generate share token for public report link (includes org_id for multi-tenant)
    const { error: shareTokenError } = await supabase.from("share_tokens").insert({
      scan_id: scanId,
      org_id: orgId,
    });
    if (shareTokenError) {
      logWarn(scanId, "orchestrator", `Failed to create share token: ${shareTokenError.message}`);
    }

    const totalDuration = Date.now() - startTime;

    // Update scan as complete — scope to org_id for defense-in-depth
    await supabase
      .from("scans")
      .update({
        status: "completed",
        progress: 100,
        phase: "done",
        completed_at: new Date().toISOString(),
        cost_usd: totalCost,
        report_ready: true,
      })
      .eq("id", scanId)
      .eq("org_id", orgId);

    // -------------------------------------------------------
    // Send notification email (config-driven sender)
    // -------------------------------------------------------
    // orgConfig already resolved at scan start (line ~208) — reuse it

    const appUrl = orgConfig?.appUrl
      ?? process.env.NEXT_PUBLIC_APP_URL
      ?? process.env.APP_URL
      ?? "https://growth-marketing-problem-finder-pi.vercel.app";

    const notificationFrom = orgConfig?.notificationEmail?.from
      ?? process.env.NOTIFICATION_FROM
      ?? "GMPF <notifications@supertrained.ai>";

    try {
      if (scanRow.submitted_by) {
        const { data: user } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", scanRow.submitted_by)
          .single();

        // Get email from Supabase Auth admin API
        const { data: authUser } = await supabase.auth.admin.getUserById(
          scanRow.submitted_by
        );

        const email = authUser?.user?.email;
        if (email) {
          const safeDomain = domain.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
          const companyName = orgConfig?.company ?? "SuperTrained";
          await resend.emails.send({
            from: notificationFrom,
            to: email,
            subject: `Scan complete: ${domain}`,
            html: `
              <p>Hi ${(user?.full_name ?? "there").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")},</p>
              <p>Your growth marketing scan for <strong>${safeDomain}</strong> is complete.</p>
              <p>We found <strong>${countIssues(allResults)}</strong> issues across ${countPrimitives(allResults)} analysis areas.</p>
              <p><a href="${appUrl}/report/${scanId}">View your full report</a></p>
              <p style="color: #999; font-size: 12px;">— ${companyName}</p>
            `,
          });
        }
      }
    } catch (emailErr) {
      logError(scanId, "notification", "Failed to send notification email", emailErr);
    }

    // -------------------------------------------------------
    // Webhook callback (if callback_url was provided)
    // -------------------------------------------------------
    if (scanRow.callback_url) {
      try {
        const callbackPayload = {
          event: "scan.completed",
          scan_id: scanId,
          domain,
          audit_opinion: auditOpinion,
          biggest_problem: biggestProblem,
          report_url: `${appUrl}/api/scans/${scanId}/report`,
          _meta: scanRow.callback_meta ?? null,
        };
        const cbRes = await fetch(scanRow.callback_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(callbackPayload),
          signal: AbortSignal.timeout(10_000),
        });
        if (!cbRes.ok) {
          logWarn(scanId, "callback", `Callback returned ${cbRes.status}`);
        }
      } catch (cbErr) {
        logError(scanId, "callback", "Failed to send webhook callback", cbErr);
      }
    }

    log(scanId, "orchestrator", `Scan complete: ${domain} in ${(totalDuration / 1000).toFixed(1)}s, cost $${totalCost.toFixed(4)}`);
  } catch (error) {
    logError(scanId, "orchestrator", "Scan failed", error);

    // Clean up stale "running" primitive rows so UI doesn't show perpetual spinners
    await supabase
      .from("primitive_results")
      .update({
        status: "error",
        completed_at: new Date().toISOString(),
        error_message: "Scan failed before this primitive completed",
      })
      .eq("scan_id", scanId)
      .eq("status", "running");

    await supabase
      .from("scans")
      .update({
        status: "failed",
        error_message:
          error instanceof Error ? error.message : String(error),
      })
      .eq("id", scanId);

    // Webhook callback on failure
    if (scanRow?.callback_url) {
      try {
        await fetch(scanRow.callback_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "scan.failed",
            scan_id: scanId,
            domain,
            error: "Scan processing failed", // Sanitized — raw errors may contain internal details
            _meta: scanRow.callback_meta ?? null,
          }),
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        // Best-effort — don't throw on callback failure
      }
    }

    throw error;
  }
}

// Pure functions (formatTraffic, extractBiggestProblem, extractRankedProblems,
// inferImpact, countIssues, countPrimitives, computeAuditOpinion,
// computeDimensionCategories) are defined in ./lib/pure-functions.ts
// and re-exported above for backward compatibility.
