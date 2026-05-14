import { compressForSynthesis, estimateTokens } from "@marketing/compress-for-synthesis";

export const SYSTEM_PROMPT = `You are an elite growth marketing consultant who has audited 500+ companies. You combine deep technical knowledge (tracking, analytics, page speed, CRO) with strategic vision (positioning, competitive landscape, channel mix).

You are direct, specific, and data-driven. Every claim you make must be backed by a data point from the analysis. You never use generic advice — everything is specific to THIS company.

Your tone is that of a sharp peer who genuinely wants to help, not a salesperson. You are blunt about problems but constructive about solutions.`;

export const SYNTHESIS_SYSTEM_PROMPT = `You are synthesizing the results of a comprehensive growth marketing audit into a cohesive analysis. You have data from multiple analysis primitives covering traffic, website technical performance, messaging & positioning, content presence, tracking, ads, email, competitors, company context, brand reputation, social presence, pricing, MEO (Meaning Engine Optimization), and Agent-Native readiness.

Your job:
1. Rank all findings by business impact (revenue impact > traffic impact > technical issues > nice-to-haves)
2. Identify the single biggest growth bottleneck
3. Find patterns across primitives (e.g., no tracking + no ads = flying blind)
4. Generate specific, actionable recommendations with expected impact
5. Create both a Tier 1 outreach message and a Tier 2 detailed walkthrough script

Think deeply about what these data points MEAN for the business, not just what they ARE.

CRITICAL NUANCE RULES:
- NEVER say "they don't run ads" — say "we couldn't find active ads" or "no ads were detected in [source]"
- NEVER say "no testimonials" without qualifying — say "no testimonials visible on homepage" or "no testimonials found in [what we checked]"
- ALWAYS cite the source when making a negative claim: "According to Meta Ad Library..." or "Per DataForSEO data..." or "Based on our scan of the homepage HTML..."
- If confidence is < 60% for a finding, qualify it: "Based on limited data..." or "Our scan suggests..."
- Distinguish between "absence of evidence" and "evidence of absence"
- Frame gaps as OPPORTUNITIES, not just problems: "No email capture = untapped nurture potential for the 97% who don't convert immediately"
- When a dimension has status "error" or low confidence, acknowledge the limitation: "We were unable to fully assess [dimension] due to [reason]"

FACTUAL CLAIMS GATE:
- NEVER cite specific counts (number of services, products, customers, employees) unless that exact number appears in the structured primitive data as a measured value. Numbers from website HTML are CLAIMS by the prospect. Say "Their site mentions X" not "They have X."
- If citing specific text from the website (headlines, descriptions), it MUST appear in onPageSeo fields (h1, title, metaDescription, openGraph) which are deterministic DOM extractions. Do NOT cite text from strategicAnalysis as if it appeared on the page — that data is LLM-generated and may not be verbatim.
- If you're not sure where a number or quote came from, OMIT it entirely. Being wrong about a verifiable fact destroys trust in all other findings.

AD DATA NULL HANDLING:
- When metaAds.activeAdCount is null OR metaAds.scrapingSucceeded is false, treat as "Could not verify Meta ad activity" — NOT "no ads running". Explicitly say: "We were unable to access the Meta Ad Library for this company."
- When googleAds.activeAdCount is null OR googleAds.scrapingSucceeded is false, treat as "Could not verify Google Ads activity" — NOT "no Google Ads running". Explicitly say: "We were unable to access the Google Ads Transparency Center for this company."
- When activeAdCount is null, do NOT count this as a finding or problem. It is an assessment limitation, not evidence of anything.
- When estimatedSpendTier is "unknown", do NOT draw conclusions about ad spend.

SEVERITY RATIONING: Maximum 2 findings should be rated "critical" per report. If more than 2 qualify, downgrade the least impactful to "high".

TRAFFIC DATA CAVEAT:
- DataForSEO traffic estimates are directional approximations, NOT exact numbers.
- ALWAYS prefix traffic numbers with "estimated" or "~" (e.g., "~2,500 monthly organic visits").
- NEVER cite traffic numbers as precise facts. Say "DataForSEO estimates approximately X monthly visits" not "The site gets X visits."
- If traffic data is used as evidence for a finding, acknowledge the estimate: "Based on estimated traffic of ~X/month..."

FINDING QUALITY GATE:
- NEVER cite RSS feed absence, BIMI configuration, canonical tags, multiple H1 tags, or "company not found in [data source]" in the outreach message or ranked problems. These findings damage credibility with prospects.
- Findings with confidence below 50% should be qualified as observations ("our scan suggests..."), never stated as facts.
- Do not mention sitemap.xml absence for sites with fewer than 50 estimated pages.
- "No structured data (JSON-LD)" is only relevant for e-commerce or recipe sites — skip for B2B/services.
- "No MX records found" should never appear — if the prospect receives email, this is a DNS lookup failure, not a finding.

DETECTION SCOPE RULES:
- Signals beginning with "Could not detect" reflect a LIMITED automated scan, not omniscient knowledge.
- NEVER convert "Could not detect X" into "X is missing" or "doesn't have X" in the outreach message.
- When describing what was NOT found, LEAD with what WAS found instead: "Your sitemap has 7 pages and you rank for 12 keywords" is better than "No blog detected."
- If 3+ detection signals are negative for the same company, add: "Several aspects weren't detectable in our automated scan — a manual review may reveal more."
- Only social platforms with broken/dead links should be flagged. Do NOT list "missing" social platforms.

ROOT CAUSE TRACING:
- When reporting low traffic, ALWAYS check whether the data shows a technical root cause (sitemap coverage gaps, indexing blocks, robots.txt issues).
- Present root causes BEFORE symptoms: "Only 7 of 28 blog posts appear in the sitemap, which likely limits organic indexing" comes before "Estimated organic traffic is near zero."
- Distinguish between symptoms and causes. Traffic numbers are symptoms. Sitemap coverage, indexing issues, and content gaps are causes.

COMPETITOR QUALIFICATION:
- Only reference competitors if the competitor data has high confidence.
- If competitor signals say "Could not identify confident direct competitors," do NOT fabricate or guess competitors.
- Never compare the prospect to companies in different markets. If unsure whether a company is a real competitor, omit the comparison entirely.`;

interface PrimitiveResults {
  trafficAnalysis: unknown;
  websiteCro: unknown;
  websiteTechnical?: unknown;
  websiteMessaging?: unknown;
  contentPresence?: unknown;
  trackingAnalytics: unknown;
  metaAds: unknown;
  googleAds: unknown;
  emailAnalysis: unknown;
  competitorContext: unknown;
  companyEnrichment: unknown;
  brandReputation?: unknown;
  socialOrganic?: unknown;
  pricingMonetization?: unknown;
  meoAnalysis?: unknown;
  agentNative?: unknown;
  _crossDimensionalPatterns?: unknown;
  _marketingMaturity?: unknown;
  _industryContext?: string | null;
  _industryChecks?: unknown;
  _confidence?: Record<string, { confidence: number; factors: string[] }>;
}

/** Primitive key (camelCase) → snake_case for compressor lookup */
const CAMEL_TO_SNAKE: Record<string, string> = {
  trafficAnalysis: "traffic_analysis",
  websiteCro: "website_cro",
  websiteTechnical: "website_technical",
  websiteMessaging: "website_messaging",
  contentPresence: "content_presence",
  trackingAnalytics: "tracking_analytics",
  metaAds: "meta_ads",
  googleAds: "google_ads",
  emailAnalysis: "email_analysis",
  competitorContext: "competitor_context",
  companyEnrichment: "company_enrichment",
  brandReputation: "brand_reputation",
  socialOrganic: "social_organic",
  pricingMonetization: "pricing_monetization",
  meoAnalysis: "meo_analysis",
  agentNative: "agent_native",
};

/** Token budget for the entire synthesis payload (50K default) */
const SYNTHESIS_TOKEN_BUDGET = 50_000;

function formatResults(results: PrimitiveResults): string {
  return Object.entries(results)
    .filter(([key]) => !key.startsWith("_")) // Exclude cross-dimensional metadata
    .map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, " $1").trim();
      const snakeKey = CAMEL_TO_SNAKE[key] ?? key;
      const compressed = compressForSynthesis(snakeKey, value);
      return `## ${label}\n\`\`\`json\n${JSON.stringify(compressed, null, 2)}\n\`\`\``;
    })
    .join("\n\n");
}

function formatCrossDimensionalData(results: PrimitiveResults): string {
  const sections: string[] = [];

  const patterns = results._crossDimensionalPatterns as Array<{
    pattern: string;
    dimensions: string[];
    severity: string;
    insight: string;
  }> | undefined;

  if (patterns && patterns.length > 0) {
    sections.push(
      `CROSS-DIMENSIONAL PATTERNS DETECTED:\n${patterns.map((p) =>
        `- [${p.severity.toUpperCase()}] ${p.pattern}: ${p.insight}`
      ).join("\n")}`
    );
  }

  const maturity = results._marketingMaturity as {
    level: number;
    label: string;
    factors: string[];
    breakdown: Record<string, number>;
  } | undefined;

  if (maturity) {
    sections.push(
      `MARKETING MATURITY: Level ${maturity.level}/5 (${maturity.label})\nFactors: ${maturity.factors.join(", ")}`
    );
  }

  const industryCtx = results._industryContext;
  if (industryCtx) {
    sections.push(industryCtx);
  }

  const industryChecks = results._industryChecks as {
    segment: string;
    signals: Array<{ signal: string; found: boolean; category: string; importance: string }>;
    recommendations: string[];
  } | undefined;
  if (industryChecks && industryChecks.signals.length > 0) {
    const foundSignals = industryChecks.signals.filter(s => s.found);
    const missingSignals = industryChecks.signals.filter(s => !s.found);
    sections.push(
      `INDUSTRY-SPECIFIC ANALYSIS (${industryChecks.segment}):\nPresent: ${foundSignals.map(s => s.signal).join("; ") || "None detected"}\nMissing: ${missingSignals.map(s => s.signal).join("; ") || "None"}`
    );
  }

  // Confidence summary — so synthesis knows how reliable each dimension's data is
  const confidence = results._confidence as Record<string, { confidence: number; factors: string[] }> | undefined;
  if (confidence && Object.keys(confidence).length > 0) {
    const lowConfidence = Object.entries(confidence)
      .filter(([, v]) => v.confidence < 0.5)
      .map(([k, v]) => `${k}: ${Math.round(v.confidence * 100)}% (${v.factors[0] ?? "limited data"})`)
      .join("\n  ");
    if (lowConfidence) {
      sections.push(
        `LOW-CONFIDENCE DIMENSIONS (qualify claims from these):\n  ${lowConfidence}`
      );
    }
  }

  return sections.length > 0 ? "\n\n" + sections.join("\n\n") : "";
}

type SynthesisTemplate = {
  reportStructure?: string;
  findingFormat?: string;
  strengthsInstruction?: string;
  actionPlanFormat?: string;
  outreachRules?: string;
  loomScriptStructure?: string;
  loomScriptTone?: string;
};

export function buildTier1OutreachPrompt(
  results: PrimitiveResults,
  companyName: string,
  contactName?: string,
  agencyTemplate?: SynthesisTemplate
): string {
  // Agency-specific overrides for report structure and outreach style
  const agencyBlock = agencyTemplate ? `
AGENCY-SPECIFIC OUTPUT FORMAT:
${agencyTemplate.reportStructure ? `REPORT STRUCTURE: ${agencyTemplate.reportStructure}` : ""}
${agencyTemplate.findingFormat ? `FINDING FORMAT: ${agencyTemplate.findingFormat}` : ""}
${agencyTemplate.strengthsInstruction ? `STRENGTHS: ${agencyTemplate.strengthsInstruction}` : ""}
${agencyTemplate.actionPlanFormat ? `ACTION PLAN: ${agencyTemplate.actionPlanFormat}` : ""}
${agencyTemplate.outreachRules ? `OUTREACH STYLE: ${agencyTemplate.outreachRules}` : ""}
`.trim() : "";

  return `Based on the following growth marketing audit data, produce a JSON response containing:
1. A Tier 1 outreach message
2. A ranked list of the top 5 problems found
3. The single biggest problem as a headline
4. An overall audit opinion
5. Per-dimension MHAS categories

${agencyBlock ? agencyBlock + "\n\n" : ""}OUTREACH MESSAGE RULES:
- Under 150 words. Tight, punchy, specific.
- Open with the single biggest problem you found + the specific data point that proves it.
- Make the recipient feel "seen" — reference something specific about THEIR business, not generic.
- CTA: "Want me to record a 3-minute walkthrough of everything I found?"
- NO agency name. NO pitch. NO "I hope this finds you well." NO "I noticed that..."
- Tone: A sharp peer who noticed something interesting. Not a salesperson.
- Use the contact's first name if available.
- Include 1-2 secondary problems as supporting evidence.
- End with the CTA — nothing after it.

OUTREACH VOICE (write like a peer, not a vendor):
- The message should read like it came from someone who understands their world.
- Use contractions. Read it aloud. If it sounds like marketing copy, rewrite it.
- Every sentence must earn its place — if it doesn't move toward a reply, cut it.
- Lead with THEIR world, not yours. "You/your" should dominate over "I/we."
- One ask, low friction. Interest-based CTA, not a meeting request.
- Structure: Observation → Problem → Proof → Ask. You noticed X, which usually means Y. We found Z. Interested?

ANTI-AI WRITING PATTERNS (avoid these tells):
- No "testament to", "pivotal", "crucial role", "underscores", "landscape", "tapestry"
- No "Additionally", "Furthermore", "It gets worse:", "Combined with"
- No -ing phrases that add fake depth: "highlighting", "showcasing", "reflecting"
- No "serves as", "stands as" — just use "is"
- No rule-of-three forcing (two problems is fine, four is fine)
- No em dash overuse — use commas or periods
- No "Not only X but also Y" constructions
- No filler: "In order to", "It is important to note", "Due to the fact that"
- No generic positives: "exciting times ahead", "the future looks bright"
- Vary sentence length. Short punches mixed with longer ones.
- Have an opinion. Don't just report neutrally.

RANKED PROBLEMS RULES (Five C's structure):
For each problem:
- criteria: What best practice looks like (1 sentence)
- condition: What we found, with specific data (1-2 sentences)
- confidence_level: "high" / "moderate" / "low" — independent from severity
- consequence: Revenue/performance impact estimate. Use ranges when possible ("$X-Y/month"). When unquantifiable: "Significant but requires [specific data] to estimate"
- corrective_action: Specific, prioritized recommendation (1-2 sentences)
- Include benchmarks from competitor data when available

ICE SCORING (for each ranked problem):
For each problem, also compute an ICE score:
- Impact (1-10): How much will fixing this move the needle? (from severity + business context)
- Confidence (1-10): How sure are we this is actually a problem? (from primitive confidence + data quality)
- Ease (1-10): How easy is this to fix? (1=months of work, 10=30-minute fix)
- ICE Score = Impact x Confidence x Ease

ICE EASE REFERENCE POINTS:
- 10 = 30-minute fix (e.g., add a missing meta tag, fix a broken link)
- 8 = Half-day task (e.g., set up Google Tag Manager, configure DMARC)
- 6 = 1-2 day project (e.g., redesign CTA hierarchy, implement consent mode)
- 4 = 1-2 week project (e.g., content strategy overhaul, set up marketing automation)
- 2 = Multi-week initiative (e.g., full website redesign, implement server-side tracking)
- 1 = Multi-month transformation (e.g., complete marketing stack rebuild)

Sort the ranked_problems list by ICE score descending. Label the top 2-3 items as quick wins (high ICE score = high impact + high confidence + easy to fix).

AUDIT OPINION:
- "Sound" = No critical or significant findings; <3 observations total
- "Qualified" = 1+ significant findings but no critical ones
- "Deficient" = 1+ critical findings OR 3+ significant findings
- "Incomplete" = 3+ dimensions returned "Could Not Assess" or had errors

DIMENSION CATEGORIES (0-4 scale):
For each of the 10 dimensions, assign a category:
- 0 = Not Assessed (failed, errored, or insufficient data)
- 1 = No Issues Identified (routine monitoring)
- 2 = Minor Opportunities (optimize when convenient)
- 3 = Significant Deficiency (remediate within 30-60 days)
- 4 = Critical Problem (immediate action required)

Company: ${companyName}
${contactName ? `Contact: ${contactName}` : ""}

AUDIT DATA:
${formatResults(results)}
${formatCrossDimensionalData(results)}

Return JSON (and ONLY valid JSON, no markdown fences, no explanatory text):
{
  "outreach_message": "the outreach message text",
  "ranked_problems": [
    {
      "rank": 1,
      "title": "Short problem title (5-10 words)",
      "description": "2-3 sentences: what we found + business impact",
      "impact": "critical|high|medium|low",
      "category": "trafficAnalysis|websiteCro|websiteTechnical|websiteMessaging|contentPresence|trackingAnalytics|metaAds|googleAds|emailAnalysis|competitorContext|companyEnrichment|brandReputation|socialOrganic|pricingMonetization|meoAnalysis|agentNative",
      "data_point": "The specific number or fact backing this up",
      "opportunity": "What fixing this could achieve",
      "criteria": "What best practice looks like",
      "confidence_level": "high|moderate|low",
      "consequence": "Revenue impact estimate or range",
      "corrective_action": "Specific recommendation",
      "ice": {
        "impact": "1-10",
        "confidence": "1-10",
        "ease": "1-10",
        "score": "impact * confidence * ease",
        "quick_win": "true if in top 2-3 by ICE score"
      }
    }
  ],
  "biggest_problem": "First full sentence describing the #1 problem",
  "audit_opinion": "Sound|Qualified|Deficient|Incomplete",
  "dimension_categories": {
    "trafficAnalysis": 0-4,
    "websiteCro": 0-4,
    "trackingAnalytics": 0-4,
    "metaAds": 0-4,
    "googleAds": 0-4,
    "emailAnalysis": 0-4,
    "competitorContext": 0-4,
    "companyEnrichment": 0-4,
    "brandReputation": 0-4,
    "socialOrganic": 0-4,
    "pricingMonetization": 0-4,
    "meoAnalysis": 0-4,
    "agentNative": 0-4
  }
}`;
}

export function buildTier2LoomScriptPrompt(
  results: PrimitiveResults,
  companyName: string,
  screenshotPaths: string[],
  agencyTemplate?: SynthesisTemplate,
  loomStyle?: { tone: string; structure: string; cta: string }
): string {
  const screenshotList = screenshotPaths.length > 0
    ? `\nAvailable screenshots:\n${screenshotPaths.map((p, i) => `  ${i + 1}. ${p}`).join("\n")}`
    : "\nNo screenshots available — reference URLs instead.";

  // Agency-specific Loom overrides
  const toneOverride = agencyTemplate?.loomScriptTone ?? loomStyle?.tone;
  const structureOverride = agencyTemplate?.loomScriptStructure ?? loomStyle?.structure;
  const ctaOverride = loomStyle?.cta;

  const agencyLoomBlock = (toneOverride || structureOverride || ctaOverride) ? `
AGENCY-SPECIFIC LOOM STYLE:
${toneOverride ? `TONE: ${toneOverride}` : ""}
${structureOverride ? `STRUCTURE: ${structureOverride}` : ""}
${ctaOverride ? `CTA: ${ctaOverride}` : ""}

` : "";

  return `Based on the following growth marketing audit data, create a Tier 2 Loom-style video walkthrough script.

${agencyLoomBlock}STRUCTURE (7 sections):

Section 1 — HOOK (15 seconds)
- Mirror the Tier 1 outreach opening
- "I ran a full growth audit on [company] and found X problems. Let me walk you through the biggest ones."

Sections 2-6 — PROBLEMS (ranked by business impact, ~45 seconds each)
- Each section needs:
  - "say": Exact words to speak (conversational, not scripted-sounding)
  - "show": What to display (screenshot path or URL to navigate to)
  - "keyStat": The single most impactful number for this problem

Section 7 — CLOSE (15 seconds)
- Summarize: "So you've got [problem 1], [problem 2], and [problem 3] all working against you."
- CTA: "I've got a full report with everything I found plus a prioritized fix list. Want me to send it over?"

RULES:
- Total script should be ~3 minutes when spoken aloud
- Every problem must have a specific data point
- Rank problems by revenue impact, not technical severity
- Use natural speech patterns — "so", "here's the thing", "look at this"
- Reference specific screenshots/URLs for each section
- NEVER say "they don't have X" — say "I couldn't find X" or "there's no visible X"
- Frame problems as opportunities: "If you fixed this, you could..."

ANTI-AI WRITING PATTERNS (the "say" text must sound spoken, not written):
- No "testament to", "pivotal", "crucial", "underscores", "landscape"
- No "Additionally", "Furthermore", "Moreover"
- No -ing phrases: "highlighting", "showcasing", "reflecting", "emphasizing"
- No "serves as" / "stands as" — just "is"
- No rule-of-three forcing. Two things or four things is fine.
- No filler: "It is important to note", "In order to", "At the end of the day"
- Use contractions (you're, they're, isn't, don't, won't)
- Vary rhythm: short sentence, then longer one. Not uniform cadence.
- Sound like talking to a colleague over coffee, not reading a teleprompter
- Have opinions. "This is a problem" beats "This could potentially be concerning"

Company: ${companyName}
${screenshotList}

AUDIT DATA:
${formatResults(results)}
${formatCrossDimensionalData(results)}

Return JSON:
{
  "sections": [
    {
      "title": "Hook",
      "say": "...",
      "show": "screenshot path or URL",
      "keyStat": "stat or null",
      "durationSeconds": 15
    }
  ],
  "totalDurationSeconds": number,
  "topProblemSummary": "one sentence summary of the #1 problem"
}`;
}

/**
 * Build a lightweight mini-synthesis prompt for progressive report delivery.
 * Runs on partial results (3+ primitives) using Haiku for speed.
 * Returns top 3 problems + overall assessment + biggest problem headline.
 */
export function buildMiniSynthesisPrompt(
  partialResults: Record<string, unknown>,
  companyName: string,
  completedCount: number,
  totalCount: number
): string {
  // Only include completed primitives
  const available = Object.entries(partialResults)
    .filter(([key, value]) => !key.startsWith("_") && value !== null && value !== undefined)
    .map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, " $1").trim();
      const snakeKey = CAMEL_TO_SNAKE[key] ?? key;
      const compressed = compressForSynthesis(snakeKey, value);
      return `## ${label}\n\`\`\`json\n${JSON.stringify(compressed, null, 2)}\n\`\`\``;
    })
    .join("\n\n");

  return `Based on PARTIAL growth marketing audit data (${completedCount} of ${totalCount} analyses complete), identify the top 3 most impactful problems found so far for ${companyName}.

This is a PRELIMINARY analysis — more data is incoming. Focus on what's clear from the available data.

RULES:
- Only reference data you actually have — don't speculate about incomplete dimensions
- Each problem needs: title (5-10 words), description (1-2 sentences), impact level (critical/high/medium/low)
- Include the specific data point backing each problem
- Identify the single biggest problem as a headline

AVAILABLE DATA:
${available}

Return JSON (and ONLY valid JSON):
{
  "biggest_problem": "one sentence describing the #1 problem found so far",
  "ranked_problems": [
    {
      "rank": 1,
      "title": "Short problem title",
      "description": "What we found + why it matters",
      "impact": "critical|high|medium|low",
      "data_point": "The specific number or fact"
    }
  ],
  "audit_opinion": "Preliminary — ${completedCount}/${totalCount} analyses complete",
  "completeness_note": "Which areas we haven't analyzed yet"
}`;
}
