import { createEnvelope, createErrorEnvelope, type Envelope } from "@marketing/envelope";
import { complete, getModelName } from "@marketing/models";
import { cleanHtmlForLlm } from "@marketing/html-cleaner";

// ── Data Interface ──

export interface WebsiteMessagingData {
  strategicAnalysis: {
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
  signals: string[];
  methodology: string[];
}

// ── Prompt ──

const STRATEGIC_ANALYSIS_PROMPT = `You are an elite growth marketing strategist. Analyze this website's strategic effectiveness using these expert frameworks.

MESSAGING ANALYSIS (Wynter's 5-Layer B2B Message Framework):
Score each layer 1-5:
1. CLARITY — "I get it." Can a visitor understand what this company does within 5 seconds?
2. RELEVANCE — "It's for me." Is the target audience clearly defined and addressed?
3. VALUE — "I want the promises." Are outcomes specific and desirable?
4. DIFFERENTIATION — "Why you?" Is there a named mechanism, unique process, or competitive advantage?
5. FRICTION — What doubts remain? What objections are unaddressed? (1=many doubts, 5=all addressed)

CRITICAL: For headline, subheadline, and primaryCta, return ONLY text that appears VERBATIM on the page or in the VERIFIED PAGE TEXT section. If you cannot find the exact text, return null for that field. Do NOT fabricate, paraphrase, or infer headlines that don't exist on the page.

POSITIONING ANALYSIS (April Dunford's Obviously Awesome):
Score each component 1-5:
1. AUDIENCE CLARITY — From "everyone" (1) to named segment with firmographics (5)
2. PROBLEM CLARITY — From unstated (1) to quantified problem (5)
3. SOLUTION CLARITY — From feature dump (1) to clear outcome with proof (5)
4. DIFFERENTIATION — From generic (1) to named alternatives + why different (5)
5. CATEGORY FIT — From confusing (1) to clear category + reframing (5)

Apply the 5-Second Test: From the homepage hero ALONE, can you answer:
(a) What does this company do? (b) Who is it for? (c) Why them vs alternatives?

OFFER ANALYSIS (Hormozi Value Equation):
Value = (Dream Outcome x Perceived Likelihood) / (Time Delay x Effort)
Score each 1-5:
- DREAM OUTCOME: Is it clearly stated? Specific or generic?
- PERCEIVED LIKELIHOOD: Proof, credentials, process shown?
- TIME DELAY: How quickly do results come? Is this communicated?
- EFFORT/SACRIFICE: Easy onboarding, done-for-you, guarantee?

CONVERSION PATH ANALYSIS (Orbit Media / Copyhackers):
1. PRIMARY CTA — What is it? Above the fold? Clear?
2. SECONDARY PATHS — Paths for different intent levels (learn vs buy vs talk to sales)?
3. CTA CONSISTENCY — Same primary action across sections, or competing?
4. FORM FRICTION — How many fields? Progressive disclosure?
5. COPY ORIENTATION — Benefit-driven or feature-driven? Customer language or jargon?
6. RISK REDUCTION — Guarantees, free trial, demo offer, social proof near decisions?

CONTENT MARKETING:
- Blog/resources section present? Link found in navigation?
- Newsletter/email signup visible?
- Lead magnets or gated content?
- Content funnel coverage: TOFU (educational), MOFU (comparison), BOFU (decision)?

Return JSON:
{
  "messaging": {
    "clarity": 1-5, "relevance": 1-5, "value": 1-5, "differentiation": 1-5, "friction": 1-5,
    "headline": "exact text", "subheadline": "exact text", "primaryCta": "exact text"
  },
  "positioning": {
    "audienceClarity": 1-5, "problemClarity": 1-5, "solutionClarity": 1-5,
    "differentiation": 1-5, "categoryFit": 1-5,
    "fiveSecondTest": { "whatDoYouDo": true/false, "isItForMe": true/false, "whyYou": true/false }
  },
  "offer": {
    "dreamOutcome": 1-5, "perceivedLikelihood": 1-5, "timeDelay": 1-5, "effort": 1-5,
    "overallScore": 1-5
  },
  "conversionPath": {
    "primaryCta": "description", "secondaryPaths": "description",
    "ctaConsistency": "description", "formFriction": "description",
    "copyOrientation": "benefit-driven|feature-driven|mixed",
    "riskReduction": "description",
    "pathRating": "clear|cluttered|missing|broken",
    "copyRating": "compelling|adequate|generic|confusing"
  },
  "contentMarketing": {
    "blogPresent": true/false, "lastPostDate": "date or null",
    "publishingFrequency": "description or null",
    "leadMagnets": ["description"],
    "contentFunnel": "description of TOFU/MOFU/BOFU coverage",
    "newsletterSignup": true/false
  }
}`;

// ── Main Runner ──

/** Ground truth extracted via deterministic Playwright DOM queries */
export interface PageGroundTruth {
  h1?: string | null;
  title?: string | null;
  metaDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
}

export async function runWebsiteMessaging(
  url: string,
  htmlContent: string,
  groundTruth?: PageGroundTruth
): Promise<Envelope<WebsiteMessagingData | null>> {
  const startTime = Date.now();
  const primitive = "website_messaging";
  const methodology: string[] = [];

  try {
    // Clean HTML before sending to LLM — use a larger window for strategic analysis
    const truncatedHtml = cleanHtmlForLlm(htmlContent, 30_000);
    methodology.push(`Cleaned HTML for strategic analysis (${truncatedHtml.length} chars)`);

    // Build ground truth context for the prompt
    let groundTruthBlock = "";
    if (groundTruth) {
      const parts: string[] = [];
      if (groundTruth.h1) parts.push(`H1: "${groundTruth.h1}"`);
      if (groundTruth.title) parts.push(`Page title: "${groundTruth.title}"`);
      if (groundTruth.metaDescription) parts.push(`Meta description: "${groundTruth.metaDescription}"`);
      if (groundTruth.ogTitle) parts.push(`OG title: "${groundTruth.ogTitle}"`);
      if (groundTruth.ogDescription) parts.push(`OG description: "${groundTruth.ogDescription}"`);
      if (parts.length > 0) {
        groundTruthBlock = `\n\nVERIFIED PAGE TEXT (extracted via DOM, use these exact values):\n${parts.join("\n")}`;
      }
    }

    // Strategic Analysis with Opus
    let strategicAnalysis: WebsiteMessagingData["strategicAnalysis"] = null;
    const strategicResult = await complete("opus", [
      { role: "user", content: `Analyze this website for strategic effectiveness:\n\nURL: ${url}${groundTruthBlock}\n\n${truncatedHtml}` },
    ], {
      system: STRATEGIC_ANALYSIS_PROMPT,
      temperature: 0.3,
    });
    methodology.push("Opus strategic analysis complete (messaging, positioning, offer, conversion path, content)");

    try {
      strategicAnalysis = JSON.parse(strategicResult.content);
    } catch {
      const jsonMatch = strategicResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) strategicAnalysis = JSON.parse(jsonMatch[0]);
    }

    // Build signals from strategic analysis
    const signals: string[] = [];

    if (strategicAnalysis) {
      const msg = strategicAnalysis.messaging;
      if (msg && msg.clarity <= 2) {
        signals.push(`Homepage messaging lacks clarity (scored ${msg.clarity}/5) — visitors may not understand what you do`);
      }
      if (msg && msg.differentiation <= 2) {
        signals.push(`Weak differentiation (scored ${msg.differentiation}/5) — no clear reason to choose over alternatives`);
      }

      const pos = strategicAnalysis.positioning;
      if (pos?.fiveSecondTest) {
        const failCount = [pos.fiveSecondTest.whatDoYouDo, pos.fiveSecondTest.isItForMe, pos.fiveSecondTest.whyYou]
          .filter((v) => !v).length;
        if (failCount >= 2) {
          signals.push(`Failed 5-second test (${3 - failCount}/3 questions answerable from hero alone)`);
        }
      }

      const offer = strategicAnalysis.offer;
      if (offer && offer.overallScore <= 2) {
        signals.push(`Weak offer clarity (scored ${offer.overallScore}/5) — value proposition not compelling`);
      }

      const cp = strategicAnalysis.conversionPath;
      if (cp) {
        if (cp.pathRating === "missing" || cp.pathRating === "broken") {
          signals.push(`Conversion path rated "${cp.pathRating}" — visitors have no clear next step`);
        }
        if (cp.copyRating === "generic" || cp.copyRating === "confusing") {
          signals.push(`Website copy rated "${cp.copyRating}" — may not resonate with target audience`);
        }
      }

      const cm = strategicAnalysis.contentMarketing;
      if (cm && !cm.blogPresent) {
        signals.push("No blog or resources section found — missing content marketing foundation");
      }
      if (cm && !cm.newsletterSignup) {
        signals.push("No email signup found — missing nurture pipeline for the 97% who don't buy immediately");
      }
    }

    // Calculate confidence based on analysis completeness
    let confidence = 0.5;
    if (strategicAnalysis) {
      confidence += 0.2;
      if (strategicAnalysis.messaging) confidence += 0.05;
      if (strategicAnalysis.positioning) confidence += 0.05;
      if (strategicAnalysis.offer) confidence += 0.05;
      if (strategicAnalysis.conversionPath) confidence += 0.05;
      if (strategicAnalysis.contentMarketing) confidence += 0.05;
    }
    confidence = Math.min(confidence, 0.95);

    return createEnvelope<WebsiteMessagingData>(primitive, startTime, {
      strategicAnalysis,
      signals,
      methodology,
    }, {
      confidence,
      confidenceFactors: [
        strategicAnalysis ? "Opus strategic analysis complete" : "Strategic analysis failed",
        strategicAnalysis?.messaging ? `Messaging clarity: ${strategicAnalysis.messaging.clarity}/5` : "Messaging analysis unavailable",
        strategicAnalysis?.positioning ? `Positioning score: ${strategicAnalysis.positioning.audienceClarity}/5` : "Positioning analysis unavailable",
        strategicAnalysis?.offer ? `Offer score: ${strategicAnalysis.offer.overallScore}/5` : "Offer analysis unavailable",
        strategicAnalysis?.conversionPath ? `Path: ${strategicAnalysis.conversionPath.pathRating}, Copy: ${strategicAnalysis.conversionPath.copyRating}` : "Conversion path analysis unavailable",
        `HTML analyzed: ${truncatedHtml.length} chars`,
      ],
      model: getModelName("opus"),
      tokensUsed: strategicResult.usage.inputTokens + strategicResult.usage.outputTokens,
      costUsd: strategicResult.usage.cost,
    });
  } catch (error) {
    return createErrorEnvelope(primitive, startTime, error);
  }
}
