/**
 * website-cro.ts — Legacy wrapper
 *
 * This module is retained for backward compatibility during the transition
 * from the monolithic website_cro primitive to the split primitives:
 *   - website_technical  (screenshots, PageSpeed, Haiku CRO, trust signals, SEO)
 *   - website_messaging   (Opus strategic analysis: messaging, positioning, offer)
 *   - content_presence    (blog, sitemap, RSS, lead magnets, content funnel)
 *
 * The orchestrator still calls runWebsiteCro for existing scans.
 * New scans should use the DAG executor with the split primitives.
 */

import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { type PageSpeedResult } from "@marketing/pagespeed";
import { runWebsiteTechnical, type WebsiteTechnicalData } from "./website-technical";
import { runWebsiteMessaging, type WebsiteMessagingData } from "./website-messaging";
import { runContentPresence, type ContentPresenceData } from "./content-presence";

// Re-export new primitive interfaces for consumers
export type { WebsiteTechnicalData } from "./website-technical";
export type { WebsiteMessagingData } from "./website-messaging";
export type { ContentPresenceData } from "./content-presence";

// ── Legacy CroData interface (preserved for backward compatibility) ──

export interface CroData {
  screenshots: {
    desktopPath: string | null;
    mobilePath: string | null;
  };
  pagespeed: {
    mobile: PageSpeedResult | null;
    desktop: PageSpeedResult | null;
  };
  analysis: {
    trustSignals: string[];
    ctaAnalysis: string[];
    aboveFoldContent: string[];
    formFriction: string[];
    mobileIssues: string[];
    navigationUx: string[];
    overallGrade: string;
  };
  strategicAnalysis?: {
    messaging: {
      clarity: number;
      relevance: number;
      value: number;
      differentiation: number;
      friction: number;
      headline: string;
      subheadline: string;
      primaryCta: string;
    };
    positioning: {
      audienceClarity: number;
      problemClarity: number;
      solutionClarity: number;
      differentiation: number;
      categoryFit: number;
      fiveSecondTest: {
        whatDoYouDo: boolean;
        isItForMe: boolean;
        whyYou: boolean;
      };
    };
    offer: {
      dreamOutcome: number;
      perceivedLikelihood: number;
      timeDelay: number;
      effort: number;
      overallScore: number;
    };
    conversionPath: {
      primaryCta: string;
      secondaryPaths: string;
      ctaConsistency: string;
      formFriction: string;
      copyOrientation: string;
      riskReduction: string;
      pathRating: "clear" | "cluttered" | "missing" | "broken";
      copyRating: "compelling" | "adequate" | "generic" | "confusing";
    };
    contentMarketing: {
      blogPresent: boolean;
      lastPostDate: string | null;
      publishingFrequency: string | null;
      leadMagnets: string[];
      contentFunnel: string;
      newsletterSignup: boolean;
    };
  } | null;
  onPageSeo: {
    title: { text: string | null; length: number; issues: string[] };
    metaDescription: { text: string | null; length: number; issues: string[] };
    robots: string | null;
    h1s: { texts: string[]; count: number; issues: string[] };
    canonical: string | null;
    structuredData: { types: string[]; count: number };
    openGraph: { title: string | null; description: string | null; image: string | null; type: string | null };
    viewport: string | null;
    score: number;
    issues: string[];
  } | null;
  additionalPages: Array<{
    url: string;
    type: string;
    title: string | null;
    h1: string | null;
    formCount: number;
    ctaTexts: string[];
  }> | null;
  popupEmailCapture: Array<{ trigger: string; formFields: number; platform: string | null }>;
  gatedContent: { count: number; types: string[] } | null;
  formFrictionDetails: Array<{
    fieldCount: number;
    fields: Array<{
      type: string;
      label: string | null;
      required: boolean;
      autocomplete: string | null;
    }>;
    submitButtonText: string | null;
    hasPasswordField: boolean;
  }> | null;
  trustSignalHints: string[];
  signals: string[];
  methodology: string[];
}

// ── Legacy wrapper ──

/**
 * Legacy entry point — calls the three split primitives internally and
 * reassembles their outputs into the original CroData shape.
 *
 * @deprecated Use runWebsiteTechnical, runWebsiteMessaging, and runContentPresence directly.
 */
export async function runWebsiteCro(
  url: string,
  scanId: string
): Promise<Envelope<CroData | null>> {
  const startTime = Date.now();
  const primitive = "website_cro";
  const methodology: string[] = ["Legacy wrapper: delegating to split primitives"];

  try {
    // Phase 1: Run website_technical (Playwright-dependent)
    const technicalEnvelope = await runWebsiteTechnical(url, scanId);

    if (technicalEnvelope.status === "error" || !technicalEnvelope.data) {
      return createErrorEnvelope(primitive, startTime, new Error(
        technicalEnvelope.reasoning ?? "website_technical failed"
      ));
    }

    const tech = technicalEnvelope.data;
    methodology.push(...tech.methodology.map((m) => `[technical] ${m}`));

    // Phase 2: Run website_messaging (uses HTML + ground truth from technical)
    const groundTruth = {
      h1: tech.onPageSeo?.h1s?.texts?.[0] ?? null,
      title: tech.onPageSeo?.title?.text ?? null,
      metaDescription: tech.onPageSeo?.metaDescription?.text ?? null,
      ogTitle: tech.onPageSeo?.openGraph?.title ?? null,
      ogDescription: tech.onPageSeo?.openGraph?.description ?? null,
    };
    const messagingEnvelope = await runWebsiteMessaging(url, tech.fullPageHtml, groundTruth);
    const messaging = messagingEnvelope.data as WebsiteMessagingData | null;

    if (messaging) {
      methodology.push(...messaging.methodology.map((m) => `[messaging] ${m}`));
    } else {
      methodology.push("[messaging] Strategic analysis failed or returned null");
    }

    // Phase 3: Run content_presence (HTTP-only, no Playwright)
    const domain = new URL(url).hostname.replace(/^www\./, "");
    const contentEnvelope = await runContentPresence(url, domain);
    const content = contentEnvelope.data as ContentPresenceData | null;

    if (content) {
      methodology.push(...content.methodology.map((m) => `[content] ${m}`));
    } else {
      methodology.push("[content] Content presence analysis failed or returned null");
    }

    // Reassemble into CroData shape
    const allSignals = [
      ...tech.signals,
      ...(messaging?.signals ?? []),
      ...(content?.signals ?? []),
    ];

    // Accumulate costs
    const totalCost =
      (technicalEnvelope.metadata.costUsd ?? 0) +
      (messagingEnvelope.metadata.costUsd ?? 0) +
      (contentEnvelope.metadata.costUsd ?? 0);
    const totalTokens =
      (technicalEnvelope.metadata.tokensUsed ?? 0) +
      (messagingEnvelope.metadata.tokensUsed ?? 0) +
      (contentEnvelope.metadata.tokensUsed ?? 0);

    // Use lowest confidence of the sub-primitives
    const confidence = Math.min(
      technicalEnvelope.confidence,
      messagingEnvelope.status === "success" ? messagingEnvelope.confidence : 0.3,
      contentEnvelope.status === "success" ? contentEnvelope.confidence : 0.3
    );

    const croData: CroData = {
      screenshots: tech.screenshots,
      pagespeed: {
        mobile: tech.pagespeed.mobile,
        desktop: tech.pagespeed.desktop,
      },
      analysis: tech.analysis,
      strategicAnalysis: messaging?.strategicAnalysis ?? null,
      onPageSeo: tech.onPageSeo,
      additionalPages: tech.additionalPages,
      popupEmailCapture: tech.popupEmailCapture,
      gatedContent: tech.gatedContent,
      formFrictionDetails: tech.formFrictionDetails,
      trustSignalHints: tech.trustSignalHints,
      signals: allSignals,
      methodology,
    };

    return createEnvelope<CroData>(primitive, startTime, croData, {
      confidence,
      confidenceFactors: [
        ...technicalEnvelope.confidenceFactors,
        ...(messagingEnvelope.confidenceFactors ?? []),
        ...(contentEnvelope.confidenceFactors ?? []),
        "Legacy wrapper: assembled from 3 split primitives",
      ],
      model: technicalEnvelope.metadata.model,
      tokensUsed: totalTokens,
      costUsd: totalCost,
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
