// workers/lib/compress-for-synthesis.ts
// Per-primitive compression functions for synthesis payload optimization.
// Reduces total synthesis tokens by stripping heavy fields (HTML, raw ad text)
// and extracting only the signals + key metrics the LLM needs.

/**
 * Compress a primitive result for synthesis.
 * Returns a lighter version suitable for the LLM synthesis prompt.
 * Falls back to stripping known heavy fields if no specific compressor exists.
 */
export function compressForSynthesis(
  primitive: string,
  data: unknown
): unknown {
  if (!data || typeof data !== "object") return data;

  const compressor = COMPRESSORS[primitive];
  if (compressor) return compressor(data as Record<string, unknown>);

  // Default: strip known heavy fields
  return stripHeavyFields(data as Record<string, unknown>);
}

/** Strip fields that are universally heavy across primitives */
function stripHeavyFields(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  // HTML blobs (30-200KB each)
  delete result.fullPageHtml;
  // Raw ad creative text (already summarized in analysis fields)
  delete result.rawAdCreatives;
  // Screenshot binary paths (not useful for synthesis)
  // Keep screenshotPaths for reference but don't need full binary
  return result;
}

// ---- Per-primitive compressors ----

const COMPRESSORS: Record<string, (data: Record<string, unknown>) => unknown> = {
  traffic_analysis: (data) => ({
    traffic: summarizeTraffic(data.traffic),
    organicCost: data.organicCost,
    paidCost: data.paidCost,
    searchVisibilityIndex: data.searchVisibilityIndex,
    sitemapDetected: data.sitemapDetected,
    backlinkQualityTiers: data.backlinkQualityTiers,
    quickWinKeywords: (data.quickWinKeywords as unknown[] | undefined)?.slice(0, 5),
    topPages: (data.topPages as unknown[] | undefined)?.slice(0, 5),
    signals: data.signals,
  }),

  website_technical: (data) => ({
    pagespeed: summarizePagespeed(data.pagespeed),
    onPageSeo: data.onPageSeo,
    socialLinks: data.socialLinks,
    analysis: data.analysis,
    popupEmailCapture: data.popupEmailCapture,
    gatedContent: data.gatedContent,
    formFrictionDetails: data.formFrictionDetails,
    trustSignalHints: data.trustSignalHints,
    signals: data.signals,
    // STRIPPED: fullPageHtml (100KB-1MB), screenshots (paths only)
  }),

  website_cro: (data) => ({
    pagespeed: summarizePagespeed(data.pagespeed),
    analysis: data.analysis,
    strategicAnalysis: data.strategicAnalysis,
    onPageSeo: data.onPageSeo,
    popupEmailCapture: data.popupEmailCapture,
    gatedContent: data.gatedContent,
    formFrictionDetails: data.formFrictionDetails,
    signals: data.signals,
    // STRIPPED: fullPageHtml, screenshots
  }),

  website_messaging: (data) => ({
    strategicAnalysis: data.strategicAnalysis,
    signals: data.signals,
  }),

  content_presence: (data) => ({
    blogPresent: data.blogPresent,
    blogUrl: data.blogUrl,
    sitemapFound: data.sitemapFound,
    sitemapPageCount: data.sitemapPageCount,
    rssFound: data.rssFound,
    contentPages: data.contentPages,
    lastPublishDate: data.lastPublishDate,
    newsletterSignup: data.newsletterSignup,
    leadMagnets: data.leadMagnets,
    contentFunnel: data.contentFunnel,
    retentionSignals: data.retentionSignals,
    signals: data.signals,
  }),

  tracking_analytics: (data) => ({
    detected: data.detected,
    issues: data.issues,
    cookieConsent: data.cookieConsent,
    utmHandling: data.utmHandling,
    dataLayer: summarizeDataLayer(data.dataLayer),
    cookies: summarizeCookies(data.cookies),
    ga4Events: data.ga4Events,
    consentModeV2: data.consentModeV2,
    iabApi: data.iabApi,
    consentDarkPatterns: data.consentDarkPatterns,
    consentComplianceScore: data.consentComplianceScore,
    maturityScore: data.maturityScore,
    // STRIPPED: networkRequests (can be large), consoleErrors (verbose)
  }),

  meta_ads: (data) => ({
    activeAdCount: data.activeAdCount,
    creativeTypes: data.creativeTypes,
    adDiversityScore: data.adDiversityScore,
    adCopyAnalysis: data.adCopyAnalysis,
    adLongevity: data.adLongevity,
    estimatedSpendTier: data.estimatedSpendTier,
    searchCoverage: data.searchCoverage,
    scrapingSucceeded: data.scrapingSucceeded,
    // Compress ad samples to top 3 with key fields only
    adSamples: (data.adSamples as Array<Record<string, unknown>> | undefined)
      ?.slice(0, 3)
      .map((ad) => ({
        text: typeof ad.text === "string" ? ad.text.slice(0, 200) : ad.text,
        landingPage: ad.landingPage,
        startDate: ad.startDate,
        mediaType: ad.mediaType,
      })),
    signals: data.signals,
    // STRIPPED: screenshotPaths, searchesPerformed (metadata only)
  }),

  google_ads: (data) => ({
    activeAdCount: data.activeAdCount,
    adFormats: data.adFormats,
    adDiversityScore: data.adDiversityScore,
    adCopyAnalysis: data.adCopyAnalysis,
    adLongevity: data.adLongevity,
    estimatedSpendTier: data.estimatedSpendTier,
    searchCoverage: data.searchCoverage,
    scrapingSucceeded: data.scrapingSucceeded,
    adSamples: (data.adSamples as Array<Record<string, unknown>> | undefined)
      ?.slice(0, 3)
      .map((ad) => ({
        text: typeof ad.text === "string" ? ad.text.slice(0, 200) : ad.text,
        landingPage: ad.landingPage,
        startDate: ad.startDate,
        mediaType: ad.mediaType,
      })),
    signals: data.signals,
  }),

  email_analysis: (data) => ({
    formFound: data.formFound,
    formCount: data.formCount,
    platformDetected: data.platformDetected,
    fieldCount: data.fieldCount,
    formTypes: data.formTypes,
    emailAuth: data.emailAuth,
    emailAuthMaturityScore: data.emailAuthMaturityScore,
    popupForms: data.popupForms,
    captureScore: data.captureScore,
    signals: data.signals,
    // STRIPPED: inboxId, inboxEmail (internal state), screenshotPath
  }),

  competitor_context: (data) => ({
    competitors: (data.competitors as Array<Record<string, unknown>> | undefined)
      ?.map((c) => ({
        domain: c.domain,
        name: c.name,
        traffic: c.traffic,
        pagespeed: c.pagespeed,
        techStack: c.techStack,
        emailAuth: c.emailAuth,
      })),
    comparison: data.comparison,
    keywordGap: summarizeKeywordGap(data.keywordGap),
    competitorAds: data.competitorAds,
    signals: data.signals,
    // STRIPPED: snippet (long text per competitor)
  }),

  company_enrichment: (data) => {
    const company = data.company as Record<string, unknown> | undefined;
    return {
      company: company ? {
        name: company.name,
        industry: company.industry,
        employeeCount: company.employeeCount,
        annualRevenue: company.annualRevenue,
        foundedYear: company.foundedYear,
        technologies: company.technologies,
        keywords: company.keywords,
        // PII minimization: strip individual contacts, addresses
      } : null,
      contactSummary: data.contactSummary,
      match_confidence: data.match_confidence,
      signals: data.signals,
    };
  },

  brand_reputation: (data) => ({
    reviewPlatforms: data.reviewPlatforms,
    platformsWithPresence: data.platformsWithPresence,
    platformsChecked: data.platformsChecked,
    exaMentions: data.exaMentions,
    signals: data.signals,
  }),

  social_organic: (data) => ({
    socialLinks: data.socialLinks,
    activePlatforms: data.activePlatforms,
    missingPlatforms: data.missingPlatforms,
    openGraph: data.openGraph,
    crossPromotion: data.crossPromotion,
    signals: data.signals,
    // STRIPPED: platformStatus (redundant with activePlatforms + missingPlatforms)
  }),

  pricing_monetization: (data) => ({
    pricingPageFound: data.pricingPageFound,
    pricingUrl: data.pricingUrl,
    pricingModel: data.pricingModel,
    tierCount: data.tierCount,
    riskReversal: data.riskReversal,
    featureComparison: data.featureComparison,
    annualMonthlyToggle: data.annualMonthlyToggle,
    analysis: data.analysis,
    signals: data.signals,
  }),

  meo_analysis: (data) => ({
    semanticDensityScore: data.semanticDensityScore,
    entityConsistencyScore: data.entityConsistencyScore,
    queryProximityScore: data.queryProximityScore,
    overallMeoScore: data.overallMeoScore,
    findings: data.findings,
    exaResults: data.exaResults
      ? {
          totalResults: (data.exaResults as Record<string, unknown>).totalResults,
          snippetConsistency: (data.exaResults as Record<string, unknown>).snippetConsistency,
          // Keep only first 3 snippets
          topSnippets: ((data.exaResults as Record<string, unknown>).topSnippets as unknown[] | undefined)?.slice(0, 3),
        }
      : null,
    signals: data.signals,
    recommendations: data.recommendations,
  }),

  agent_native: (data) => ({
    agentNativeScore: data.agentNativeScore,
    businessSegment: data.businessSegment,
    apiPresence: data.apiPresence,
    structuredData: data.structuredData,
    semanticHtml: data.semanticHtml,
    aiDiscoverability: data.aiDiscoverability,
    integrationSignals: data.integrationSignals,
    signals: data.signals,
    recommendations: data.recommendations,
  }),
};

// ---- Helper summarizers ----

function summarizeTraffic(traffic: unknown): unknown {
  if (!traffic || typeof traffic !== "object") return traffic;
  const t = traffic as Record<string, unknown>;
  return {
    organicTraffic: t.organicTraffic,
    organicTrafficFormatted: t.organicTrafficFormatted,
    paidTraffic: t.paidTraffic,
    paidTrafficFormatted: t.paidTrafficFormatted,
    organicCost: t.organicCost,
    paidCost: t.paidCost,
    organicKeywordsCount: t.organicKeywordsCount,
  };
}

function summarizePagespeed(pagespeed: unknown): unknown {
  if (!pagespeed || typeof pagespeed !== "object") return pagespeed;
  const ps = pagespeed as Record<string, unknown>;
  const summarizeDevice = (device: unknown): unknown => {
    if (!device || typeof device !== "object") return device;
    const d = device as Record<string, unknown>;
    return {
      performanceScore: d.performanceScore,
      firstContentfulPaint: d.firstContentfulPaint,
      largestContentfulPaint: d.largestContentfulPaint,
      cumulativeLayoutShift: d.cumulativeLayoutShift,
      totalBlockingTime: d.totalBlockingTime,
    };
  };
  return {
    mobile: summarizeDevice(ps.mobile),
    desktop: summarizeDevice(ps.desktop),
    lighthouseOpportunities: ps.lighthouseOpportunities,
  };
}

function summarizeDataLayer(dataLayer: unknown): unknown {
  if (!dataLayer || typeof dataLayer !== "object") return dataLayer;
  const dl = dataLayer as Record<string, unknown>;
  return {
    events: dl.events,
    eventCount: dl.eventCount,
    hasEcommerce: dl.hasEcommerce,
    hasCustomEvents: dl.hasCustomEvents,
    // STRIPPED: raw (full dataLayer dump)
  };
}

function summarizeCookies(cookies: unknown): unknown {
  if (!cookies || typeof cookies !== "object") return cookies;
  const c = cookies as Record<string, unknown>;
  return {
    total: c.total,
    firstParty: c.firstParty,
    thirdParty: c.thirdParty,
    categories: c.categories,
    // STRIPPED: names (full cookie name list)
  };
}

function summarizeKeywordGap(keywordGap: unknown): unknown {
  if (!keywordGap || typeof keywordGap !== "object") return keywordGap;
  const kg = keywordGap as Record<string, unknown>;
  return {
    totalGapCount: kg.totalGapCount,
    // Keep only top 5 gap keywords
    gapKeywords: (kg.gapKeywords as unknown[] | undefined)?.slice(0, 5),
  };
}

/**
 * Estimate token count for a synthesis payload.
 * Uses rough 4 chars/token heuristic.
 */
export function estimateTokens(data: unknown): number {
  const json = JSON.stringify(data);
  return Math.ceil(json.length / 4);
}

/**
 * Compress all primitive results for synthesis, with optional token budget.
 * If compressed payload exceeds budget, progressively strips more data.
 */
export function compressAllForSynthesis(
  results: Record<string, unknown>,
  tokenBudget = 50_000
): Record<string, unknown> {
  const compressed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(results)) {
    if (key.startsWith("_")) {
      // Pass through cross-dimensional metadata
      compressed[key] = value;
    } else {
      compressed[key] = compressForSynthesis(key, value);
    }
  }

  // Check token budget
  const estimatedTokens = estimateTokens(compressed);
  if (estimatedTokens > tokenBudget) {
    console.warn(
      `[compress] Synthesis payload ~${estimatedTokens} tokens exceeds budget of ${tokenBudget}. Applying aggressive compression.`
    );
    // Aggressive: strip ad samples, keyword details, competitor snippets
    for (const [key, value] of Object.entries(compressed)) {
      if (!value || typeof value !== "object" || key.startsWith("_")) continue;
      const v = value as Record<string, unknown>;
      if (v.adSamples) v.adSamples = [];
      if (v.quickWinKeywords) v.quickWinKeywords = (v.quickWinKeywords as unknown[]).slice(0, 2);
      if (v.topPages) v.topPages = (v.topPages as unknown[]).slice(0, 3);
    }
  }

  return compressed;
}
