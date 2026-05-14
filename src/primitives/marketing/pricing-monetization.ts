// workers/primitives/pricing-monetization.ts
// Pricing page analysis + offer structure detection.
// Uses HTTP requests to check pricing page existence, Haiku for structure analysis.

import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { complete, getModelName } from "@marketing/models";
import { safeFetch } from "@marketing/safe-fetch";
import { absenceSignal } from "@marketing/signal-builder";

export interface PricingMonetizationData {
  pricingPageFound: boolean;
  pricingUrl: string | null;
  pricingModel: string | null;
  tierCount: number | null;
  riskReversal: {
    moneyBackGuarantee: boolean;
    freeTrial: boolean;
    freeCancellation: boolean;
  };
  featureComparison: boolean;
  annualMonthlyToggle: boolean;
  analysis: {
    anchoring: string | null;
    paymentOptions: string[];
    ctaHierarchy: string | null;
    overallRating: "strong" | "adequate" | "weak" | "hidden" | null;
  } | null;
  signals: string[];
}

const PRICING_PATHS = [
  "/pricing",
  "/plans",
  "/packages",
  "/pricing.html",
  "/plans.html",
  "/price",
  "/buy",
  "/subscribe",
];

async function checkPricingPage(
  baseUrl: string
): Promise<{ found: boolean; url: string | null; html: string | null }> {
  const origin = new URL(baseUrl).origin;

  // Probe all paths in parallel — resolve with the first that has pricing content
  const probes = PRICING_PATHS.map(async (path) => {
    const url = `${origin}${path}`;
    const response = await safeFetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GrowthAudit/1.0)",
        Accept: "text/html",
      },
    });

    if (!response.ok) throw new Error("not found");

    const html = await response.text();
    const lowerHtml = html.toLowerCase();
    const hasPricingContent =
      lowerHtml.includes("pricing") ||
      lowerHtml.includes("per month") ||
      lowerHtml.includes("/mo") ||
      lowerHtml.includes("per year") ||
      lowerHtml.includes("/yr") ||
      (lowerHtml.includes("free trial") && lowerHtml.includes("plan")) ||
      (lowerHtml.includes("get started") && lowerHtml.includes("plan"));

    if (!hasPricingContent) throw new Error("no pricing content");
    return { found: true as const, url, html: html.slice(0, 30_000) };
  });

  try {
    return await Promise.any(probes);
  } catch {
    return { found: false, url: null, html: null };
  }
}

function detectPricingSignals(html: string): Partial<PricingMonetizationData> {
  const lowerHtml = html.toLowerCase();

  // Risk reversal signals
  const moneyBackGuarantee =
    lowerHtml.includes("money-back") ||
    lowerHtml.includes("money back") ||
    lowerHtml.includes("refund") ||
    lowerHtml.includes("guarantee");

  const freeTrial =
    lowerHtml.includes("free trial") ||
    lowerHtml.includes("try free") ||
    lowerHtml.includes("start free") ||
    lowerHtml.includes("no credit card") ||
    lowerHtml.includes("free plan") ||
    lowerHtml.includes("free tier") ||
    lowerHtml.includes("always free") ||
    lowerHtml.includes("freemium") ||
    /\$\s*0(?:\s|\.00|\/|,)/.test(lowerHtml);

  const freeCancellation =
    lowerHtml.includes("cancel anytime") ||
    lowerHtml.includes("cancel any time") ||
    lowerHtml.includes("no commitment") ||
    lowerHtml.includes("no contract");

  // Feature comparison table
  const featureComparison =
    lowerHtml.includes("compare plans") ||
    lowerHtml.includes("feature comparison") ||
    (lowerHtml.includes("<table") && lowerHtml.includes("plan")) ||
    lowerHtml.includes("what's included");

  // Annual/monthly toggle
  const annualMonthlyToggle =
    (lowerHtml.includes("monthly") && lowerHtml.includes("annual")) ||
    (lowerHtml.includes("monthly") && lowerHtml.includes("yearly")) ||
    lowerHtml.includes("billing cycle") ||
    (lowerHtml.includes("save") && lowerHtml.includes("annual"));

  return {
    riskReversal: { moneyBackGuarantee, freeTrial, freeCancellation },
    featureComparison,
    annualMonthlyToggle,
  };
}

export async function runPricingMonetization(
  url: string
): Promise<Envelope<PricingMonetizationData | null>> {
  const startTime = Date.now();
  const primitive = "pricing_monetization";

  try {
    const { found, url: pricingUrl, html } = await checkPricingPage(url);
    const signals: string[] = [];

    if (!found) {
      signals.push(
        `${absenceSignal("a public pricing page", { checked: ["/pricing", "/plans", "/packages", "+5 more"], method: "HTTP HEAD", coverage: "common_paths" })} — pricing is hidden behind "Contact Us" or "Get a Quote"`
      );
      signals.push(
        "Hidden pricing typically reduces conversion by 25-40% for SaaS and increases sales cycle length"
      );

      return createEnvelope<PricingMonetizationData>(primitive, startTime, {
        pricingPageFound: false,
        pricingUrl: null,
        pricingModel: "contact_sales",
        tierCount: null,
        riskReversal: {
          moneyBackGuarantee: false,
          freeTrial: false,
          freeCancellation: false,
        },
        featureComparison: false,
        annualMonthlyToggle: false,
        analysis: null,
        signals,
      }, {
        confidence: 0.6,
        confidenceFactors: [
          `Checked ${PRICING_PATHS.length} common pricing URLs`,
          "No pricing content detected",
        ],
      });
    }

    // Pricing page found — analyze it
    const htmlSignals = detectPricingSignals(html!);
    let analysis: PricingMonetizationData["analysis"] = null;

    // Use Haiku for pricing structure analysis
    try {
      const truncatedHtml = html!.slice(0, 15_000);
      const result = await complete("haiku", [
        { role: "user", content: `Analyze this pricing page HTML and extract the pricing structure:\n\n${truncatedHtml}` },
      ], {
        system: `Extract pricing structure from this page. Return JSON:
{
  "pricingModel": "freemium|free_trial|subscription|one_time|contact_sales|hybrid",
  "tierCount": number (how many pricing tiers),
  "anchoring": "which tier is visually emphasized as recommended (name or position)",
  "paymentOptions": ["credit_card", "paypal", "bnpl", "ach", "crypto"],
  "ctaHierarchy": "description of how CTAs are structured (e.g., 'primary on recommended tier, ghost buttons on others')",
  "overallRating": "strong|adequate|weak"
}
If you cannot determine a field, use null.`,
        temperature: 0.1,
      });

      try {
        const parsed = JSON.parse(result.content);
        analysis = {
          anchoring: parsed.anchoring ?? null,
          paymentOptions: parsed.paymentOptions ?? [],
          ctaHierarchy: parsed.ctaHierarchy ?? null,
          overallRating: parsed.overallRating ?? null,
        };

        // Extract model and tier count from LLM
        const pricingModel = parsed.pricingModel ?? null;
        const tierCount = parsed.tierCount ?? null;

        // Build signals
        if (tierCount === 1) {
          signals.push("Single pricing tier — no good-better-best anchoring");
        } else if (tierCount && tierCount >= 3) {
          signals.push(
            `${tierCount} pricing tiers with ${analysis.anchoring ? `"${analysis.anchoring}" emphasized` : "no clear anchoring"}`
          );
        }

        if (pricingModel === "contact_sales") {
          signals.push("Pricing requires contacting sales — adds friction for self-serve buyers");
        } else if (pricingModel) {
          signals.push(`Pricing model: ${pricingModel.replace(/_/g, " ")}`);
        }

        if (analysis.overallRating === "weak") {
          signals.push("Pricing page structure is weak — unclear tiers, missing social proof, or poor CTA hierarchy");
        }

        return createEnvelope<PricingMonetizationData>(primitive, startTime, {
          pricingPageFound: true,
          pricingUrl,
          pricingModel,
          tierCount,
          riskReversal: htmlSignals.riskReversal!,
          featureComparison: htmlSignals.featureComparison!,
          annualMonthlyToggle: htmlSignals.annualMonthlyToggle!,
          analysis,
          signals,
        }, {
          confidence: 0.75,
          confidenceFactors: [
            "Pricing page found and analyzed",
            `LLM analysis: ${analysis.overallRating ?? "unknown"} rating`,
          ],
          model: getModelName("haiku"),
        });
      } catch {
        // JSON parse failed — continue with HTML-only signals
      }
    } catch {
      // LLM analysis failed — continue with HTML-only signals
    }

    // Fallback: HTML-only analysis
    signals.push("Pricing page found but LLM analysis failed — limited structural data");

    if (!htmlSignals.riskReversal!.freeTrial && !htmlSignals.riskReversal!.moneyBackGuarantee) {
      signals.push(absenceSignal("risk reversal (free trial, money-back guarantee)", { checked: ["pricing page HTML"], method: "HTML pattern match", coverage: "homepage_only" }));
    }
    if (htmlSignals.riskReversal!.freeTrial) {
      signals.push("Free trial offered — reduces purchase friction");
    }
    if (!htmlSignals.featureComparison) {
      signals.push(absenceSignal("a feature comparison table", { checked: ["pricing page HTML"], method: "HTML pattern match", coverage: "homepage_only" }, "tier differentiation unclear"));
    }

    return createEnvelope<PricingMonetizationData>(primitive, startTime, {
      pricingPageFound: true,
      pricingUrl,
      pricingModel: null,
      tierCount: null,
      riskReversal: htmlSignals.riskReversal!,
      featureComparison: htmlSignals.featureComparison!,
      annualMonthlyToggle: htmlSignals.annualMonthlyToggle!,
      analysis,
      signals,
    }, {
      confidence: 0.55,
      confidenceFactors: [
        "Pricing page found",
        "HTML signal extraction only (LLM analysis failed)",
      ],
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
